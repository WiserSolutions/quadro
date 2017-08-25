/* eslint no-unused-expressions: 0 */
const amqp = require('amqplib')
const MongoClient = require('mongodb')
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
    let mongoClient = await MongoClient.connect(Q.config.get('service.storage.host'))
    scheduleCollection = await mongoClient.collection(Q.config.get('service.storage.schedule', `${serviceName}_schedule` ))
    deadLetterCollection = await mongoClient.collection(Q.config.get('service.storage.dead', `${serviceName}_dead_v2`))
  })

  describe('publish', function() {
    let connection
    let channel

    beforeEach(async function() {
      connection = await amqp.connect(Q.config.get('service.messages.host'))
      channel = await connection.createChannel()
      await scheduleCollection.remove({})
      await deadLetterCollection.remove({})
      await channel.assertQueue(QUEUE_NAME)
      await channel.purgeQueue(QUEUE_NAME)
    })

    afterEach(async function() {
      await channel.close()
      await connection.close()
      await scheduleCollection.remove({})
      await deadLetterCollection.remove({})
    })

    it('recieves a message', async function() {
      await channel.assertExchange('orders.test.consumer', 'fanout', {durable: false})
      await channel.bindQueue(QUEUE_NAME, 'orders.test.consumer', '')
      let handler = {
        handle: this.sinon.spy()
      }
      hubMessageProcessor.register('orders.test.consumer', handler)

      // Send a message through pub sub
      pubsub.publish('orders.test.consumer', { hello: 'world' })
      await Promise.delay(200)
      expect(handler.handle).to.have.been.calledWith(this.sinon.match.containSubset({message: {hello: 'world'}}))
      let scheduledEntries = await scheduleCollection.find({}).toArray()
      expect(scheduledEntries).to.be.empty
      let deadLetterEntries = await deadLetterCollection.find({}).toArray()
      expect(deadLetterEntries).to.be.empty
    })

    it('push to schedule queue on failure', async function() {
      // Get the channel
      await channel.assertExchange('orders.test.consumer', 'fanout', {durable: false})
      await channel.bindQueue(QUEUE_NAME, 'orders.test.consumer', '')
      let handler = {
        handle: this.sinon.stub().throws(new Error('error while handling message'))
      }
      hubMessageProcessor.register('orders.test.consumer', handler)
      // Send a message through pub sub
      pubsub.publish('orders.test.consumer', { hello: 'world' })
      await Promise.delay(200)
      expect(handler.handle).to.have.been.calledWith(this.sinon.match.containSubset({message: {hello: 'world'}}))
      let deadLetterEntries = await deadLetterCollection.find({}).toArray()
      expect(deadLetterEntries).to.be.empty
      let scheduledEntries = await scheduleCollection.find({}).toArray()
      expect(scheduledEntries).to.be.of.length(1)
      expect(scheduledEntries[0]).to.containSubset({message: {attemptsMade: 1, maxAttempts: 5, messageType: 'orders.test.consumer', content: {hello: 'world'}}})
      expect(scheduledEntries[0].dueTime).to.not.be.null
      expect(scheduledEntries[0].scheduledMessageId).to.not.be.null
    })

    it('push to schedule queue in dead letter on max attempts', async function() {
      // Get the channel
      await channel.assertExchange('orders.test.consumer', 'fanout', {durable: false})
      await channel.bindQueue(QUEUE_NAME, 'orders.test.consumer', '')
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
      expect(handler.handle).to.be.calledWith(this.sinon.match.containSubset({message: {hello: 'world'}}))
      let scheduledEntries = await scheduleCollection.find({}).toArray()
      expect(scheduledEntries).to.be.empty
      let deadLetterEntries = await deadLetterCollection.find({}).toArray()
      expect(deadLetterEntries).to.be.of.length(1)
      expect(deadLetterEntries[0]).to.containSubset({attemptsMade: 6, maxAttempts: 5, messageType: 'orders.test.consumer', content: {hello: 'world'}})
      expect(deadLetterEntries[0].killedAt).to.not.be.null
    })

    it('test reconnect', async function() {
      await channel.assertExchange('orders.test.consumer', 'fanout', {durable: false})
      await channel.bindQueue(QUEUE_NAME, 'orders.test.consumer', '')
      let handler = {
        handle: this.sinon.spy()
      }
      hubMessageProcessor.register('orders.test.consumer', handler)

      // Send a message through pub sub
      pubsub.publish('orders.test.consumer', { hello: 'world' })
      await Promise.delay(200)
      expect(handler.handle).to.have.been.calledWith(this.sinon.match.containSubset({message: {hello: 'world'}}))
      let scheduledEntries = await scheduleCollection.find({}).toArray()
      expect(scheduledEntries).to.be.empty
      let deadLetterEntries = await deadLetterCollection.find({}).toArray()
      expect(deadLetterEntries).to.be.empty

      handler.handle.reset()
      // Delete the queue and exchange
      await channel.deleteQueue(QUEUE_NAME)

      // Send a message through pub sub
      pubsub.publish('orders.test.consumer', { hello: 'world' })
      // Even a message is sent then it is not recieved by handler as queue is deleted
      expect(handler.handle).to.not.have.been.calledWith(this.sinon.match.containSubset({message: {hello: 'world'}}))
      // Wait for few millis for connection to break
      await Promise.delay(100)
      // Create the queue again
      await channel.assertQueue(QUEUE_NAME)
      await channel.bindQueue(QUEUE_NAME, 'orders.test.consumer', '')
      handler.handle.reset()
      pubsub.publish('orders.test.consumer', { hello: 'world' })
      await Promise.delay(200)
      expect(handler.handle).to.have.been.calledWith(this.sinon.match.containSubset({message: {hello: 'world'}}))
    })
  })
})
