/* eslint no-unused-expressions: 0 */
const amqp = require('amqplib')
const QUEUE_NAME = 'service_in'

describe('pubsub', function() {
  let pubsub
  let hubMessageProcessor
  let scheduleCollection
  let deadLetterCollection

  beforeEach(async function() {
    pubsub = await Q.container.getAsync('pubsub')
    hubMessageProcessor = await Q.container.getAsync('pubsub:hubMessageProcessor')
    let serviceName = Q.config.get('service.name')
    const mongoConnectionFactory = await Q.container.getAsync('mongoConnectionFactory')
    let mongoDB = await mongoConnectionFactory.connectToDB(Q.config.get('service.storage.host'))
    scheduleCollection = await mongoDB.collection(Q.config.get('service.storage.schedule', `${serviceName}_schedule` ))
    deadLetterCollection = await mongoDB.collection(Q.config.get('service.storage.dead', `${serviceName}_dead_v2`))
  })

  describe('publish', function() {
    let connection
    let channel

    beforeEach(async function() {
      connection = await amqp.connect(Q.config.get('service.messages.host'))
      channel = await connection.createChannel()

      await channel.assertQueue(QUEUE_NAME)
      await channel.purgeQueue(QUEUE_NAME)

      await scheduleCollection.deleteMany({})
      await deadLetterCollection.deleteMany({})

      await channel.assertExchange('orders.test.consumer', 'fanout', { durable: false })
      await channel.bindQueue(QUEUE_NAME, 'orders.test.consumer', '')
    })

    afterEach(async function() {
      try {
        await channel.close()
      } catch (err) {}
      try {
        await connection.close()
      } catch (err) {}
    })

    it('recieves a message', async function() {
      await channel.assertExchange('orders.test.consumer', 'fanout', { durable: false })
      await channel.bindQueue(QUEUE_NAME, 'orders.test.consumer', '')
      let handler = {
        handle: this.sinon.spy()
      }
      hubMessageProcessor.register('orders.test.consumer', handler)

      // Send a message through pub sub
      pubsub.publish('orders.test.consumer', { hello: 'world' })
      await Promise.delay(200)
      expect(handler.handle).to.have.been.calledWith(
        this.sinon.match.containSubset({ message: { hello: 'world' } })
      )
      let scheduledEntries = await scheduleCollection.find({}).toArray()
      expect(scheduledEntries).to.be.empty
      let deadLetterEntries = await deadLetterCollection.find({}).toArray()
      expect(deadLetterEntries).to.be.empty
    })

    it('pushes to schedule queue on retryAfterSec', async function() {
      const MSG = { hello: 'world_retry_after' }

      let handler = {
        handle: this.sinon.stub().callsFake(ctx => ctx.retryAfterSec(100))
      }

      hubMessageProcessor.register('orders.test.consumer', handler)
      pubsub.publish('orders.test.consumer', { hello: 'world_retry_after' })
      await Promise.delay(200)
      expect(handler.handle).to.have.been.calledWith(this.sinon.match.containSubset({ message: MSG }))

      let scheduledEntries = await scheduleCollection.find({}).toArray()
      expect(scheduledEntries).to.be.of.length(1)
      expect(scheduledEntries[0]).to.not.have.nested.property('message.attemptsMade')
      expect(scheduledEntries[0]).to.not.have.nested.property('message.maxAttempts')
      expect(scheduledEntries[0]).to.containSubset(
        { message: { messageType: 'orders.test.consumer', content: MSG } }
      )
      expect(scheduledEntries[0].dueTime).to.not.be.null
      expect(scheduledEntries[0].scheduledMessageId).to.not.be.null
    })

    it('push to schedule queue on failure', async function() {
      // Get the channel
      let handler = {
        handle: this.sinon.stub().throws(new Error('error while handling message'))
      }
      hubMessageProcessor.register('orders.test.consumer', handler)
      // Send a message through pub sub
      pubsub.publish('orders.test.consumer', { hello: 'world' })
      await Promise.delay(200)
      expect(handler.handle).to.have.been.calledWith(this.sinon.match.containSubset(
        { message: { hello: 'world' } }
      ))
      let deadLetterEntries = await deadLetterCollection.find({}).toArray()
      expect(deadLetterEntries).to.be.empty
      let scheduledEntries = await scheduleCollection.find({}).toArray()
      expect(scheduledEntries).to.be.of.length(1)
      expect(scheduledEntries[0]).to.containSubset({
        message: {
          attemptsMade: 1,
          maxAttempts: 5,
          messageType: 'orders.test.consumer',
          content: { hello: 'world' }
        }
      })
      expect(scheduledEntries[0].dueTime).to.not.be.null
      expect(scheduledEntries[0].scheduledMessageId).to.not.be.null
    })

    it('push to schedule queue in dead letter on max attempts', async function() {
      // Get the channel
      let handler = {
        handle: this.sinon.stub().throws(new Error('error while handling message'))
      }

      hubMessageProcessor.register('orders.test.consumer', handler)

      // Send a message through pub sub
      await channel.publish('orders.test.consumer', '',
        Buffer.from(JSON.stringify({
          messageType: 'orders.test.consumer',
          content: { hello: 'world' },
          attemptsMade: 5,
          maxAttempts: 5
        })))
      await Promise.delay(200)
      expect(handler.handle).to.be.calledWith(this.sinon.match.containSubset(
        { message: { hello: 'world' } }
      ))
      let scheduledEntries = await scheduleCollection.find({}).toArray()
      expect(scheduledEntries).to.be.empty
      let deadLetterEntries = await deadLetterCollection.find({}).toArray()
      expect(deadLetterEntries).to.be.of.length(1)
      expect(deadLetterEntries[0]).to.containSubset({
        attemptsMade: 6,
        maxAttempts: 5,
        messageType: 'orders.test.consumer',
        content: { hello: 'world' },
        lastError: { statusCode: null, body: 'error while handling message' }
      })
      expect(deadLetterEntries[0].killedAt).to.not.be.null
    })

    it('test reconnect', async function() {
      let handler = {
        handle: this.sinon.spy()
      }
      hubMessageProcessor.register('orders.test.consumer', handler)

      // Send a message through pub sub
      pubsub.publish('orders.test.consumer', { hello: 'world' })
      await Promise.delay(200)
      expect(handler.handle).to.have.been.calledWith(this.sinon.match.containSubset(
        { message: { hello: 'world' } }
      ))
      let scheduledEntries = await scheduleCollection.find({}).toArray()
      expect(scheduledEntries).to.be.empty
      let deadLetterEntries = await deadLetterCollection.find({}).toArray()
      expect(deadLetterEntries).to.be.empty

      handler.handle.reset()
      // Delete the queue and exchange
      await channel.deleteQueue(QUEUE_NAME)

      // Wait for few millis for connection to break
      await Promise.delay(300)

      // Send a message through pub sub
      pubsub.publish('orders.test.consumer', { hello: 'world' })
      // Even a message is sent then it is not recieved by handler as queue is deleted
      expect(handler.handle).to.not.have.been.calledWith(this.sinon.match.containSubset(
        { message: { hello: 'world' } }
      ))

      // Create the queue again
      await channel.assertQueue(QUEUE_NAME)
      await channel.bindQueue(QUEUE_NAME, 'orders.test.consumer', '')
      handler.handle.reset()
      pubsub.publish('orders.test.consumer', { hello: 'world' })
      await Promise.delay(200)
      expect(handler.handle).to.have.been.calledWith(this.sinon.match.containSubset(
        { message: { hello: 'world' } }
      ))
    })

    it('test final retry on final attempt', async function() {
      const message = {
        messageType: 'orders.test.consumer',
        content: { hello: 'world' },
        attemptsMade: 4,
        maxAttempts: 5
      }
      let handler = {
        handle: this.sinon.stub().callsFake(ctx => {
          expect(ctx.willRetry()).to.be.false
          ctx.success()
        })
      }
      hubMessageProcessor.register('orders.test.consumer', handler)
      // Send a message through pub sub
      await channel.publish('orders.test.consumer', '', Buffer.from(JSON.stringify(message)))
      await Promise.delay(200)
      expect(handler.handle).to.have.been.calledWith(this.sinon.match.containSubset({
        message: { hello: 'world' } }
      ))
      let deadLetterEntries = await deadLetterCollection.find({}).toArray()
      expect(deadLetterEntries).to.be.empty
    })

    it('test final retry on final attempt when first attempt is final attempt', async function() {
      const message = {
        messageType: 'orders.test.consumer',
        content: { hello: 'world' },
        maxAttempts: 1
      }
      let handler = {
        handle: this.sinon.stub().callsFake(ctx => {
          expect(ctx.willRetry()).to.be.false
          ctx.success()
        })
      }
      hubMessageProcessor.register('orders.test.consumer', handler)
      // Send a message through pub sub
      await channel.publish('orders.test.consumer', '', Buffer.from(JSON.stringify(message)))
      await Promise.delay(200)
      expect(handler.handle).to.have.been.calledWith(this.sinon.match.containSubset({
        message: { hello: 'world' } }
      ))
      let deadLetterEntries = await deadLetterCollection.find({}).toArray()
      expect(deadLetterEntries).to.be.empty
    })

    it('test not a final retry', async function() {
      const message = {
        messageType: 'orders.test.consumer',
        content: { hello: 'world' },
        attemptsMade: 1,
        maxAttempts: 5
      }
      let handler = {
        handle: this.sinon.stub().callsFake(ctx => {
          expect(ctx.willRetry()).to.be.true
          ctx.success()
        })
      }
      hubMessageProcessor.register('orders.test.consumer', handler)
      // Send a message through pub sub
      await channel.publish('orders.test.consumer', '', Buffer.from(JSON.stringify(message)))
      await Promise.delay(200)
      expect(handler.handle).to.have.been.calledWith(this.sinon.match.containSubset(
        { message: { hello: 'world' } }
      ))
      let deadLetterEntries = await deadLetterCollection.find({}).toArray()
      expect(deadLetterEntries).to.be.empty
    })

    it('push to dead letter queue when message handler not found', async function() {
      hubMessageProcessor.register('orders.test.consumer', null)
      // Send a message through pub sub
      pubsub.publish('orders.test.consumer', { hello: 'delete' })
      await Promise.delay(200)
      let scheduledEntries = await scheduleCollection.find({}).toArray()
      expect(scheduledEntries).to.be.empty
      let deadLetterEntries = await deadLetterCollection.find({}).toArray()
      expect(deadLetterEntries).to.be.of.length(1)
      expect(deadLetterEntries[0]).to.containSubset(
        { messageType: 'orders.test.consumer', content: { hello: 'delete' } }
      )
    })
  })
})
