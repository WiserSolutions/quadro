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
    let mongoClient = await MongoClient.connect(Q.config.get('service.storage.host'))
    scheduleCollection = await mongoClient.collection(Q.config.get('service.storage.schedule'))
    deadLetterCollection = await mongoClient.collection(Q.config.get('service.storage.dead'))
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
      let recievedMessage = false
      let message = {}
      await channel.assertExchange('orders.test.consumer', 'fanout', {durable: false})
      await channel.bindQueue(QUEUE_NAME, 'orders.test.consumer', '')
      let handler = {
        handle: function(messageObj) {
          recievedMessage = true
          message = messageObj
        }
      }
      hubMessageProcessor.register('orders.test.consumer', handler)

      // Send a message through pub sub
      pubsub.publish('orders.test.consumer', { hello: 'world' })
      await new Promise(function(resolve, reject) {
        setTimeout(_ => {
          resolve()
        }, 1000)
      })
      expect(recievedMessage).to.be.true
      expect(message).to.be.eql({message: {messageType: 'orders.test.consumer', content: {hello: 'world'}}})
      let scheduledEntries = await scheduleCollection.find({}).toArray()
      expect(scheduledEntries).to.be.empty
      let deadLetterEntries = await deadLetterCollection.find({}).toArray()
      expect(deadLetterEntries).to.be.empty
    })

    it('push to schedule queue on failure', async function() {
      // Get the channel
      let recievedMessage = false
      let message = {}
      await channel.assertExchange('orders.test.consumer', 'fanout', {durable: false})
      await channel.bindQueue(QUEUE_NAME, 'orders.test.consumer', '')
      let handler = {
        handle: function(messageObj) {
          recievedMessage = true
          message = messageObj
          throw new Error('error while handling message')
        }
      }

      hubMessageProcessor.register('orders.test.consumer', handler)

      // Send a message through pub sub
      pubsub.publish('orders.test.consumer', { hello: 'world' })
      await new Promise(function(resolve, reject) {
        setTimeout(_ => {
          resolve()
        }, 1000)
      })
      expect(recievedMessage).to.be.true
      expect(message).to.be.eql({message: {attemptsMade: 1, maxAttempts: 5, messageType: 'orders.test.consumer', content: {hello: 'world'}}})
      let deadLetterEntries = await deadLetterCollection.find({}).toArray()
      expect(deadLetterEntries).to.be.empty
      let scheduledEntries = await scheduleCollection.find({}).toArray()
      expect(scheduledEntries).to.be.of.length(1)
      expect(scheduledEntries[0].message).to.be.eql({attemptsMade: 1, maxAttempts: 5, messageType: 'orders.test.consumer', content: {hello: 'world'}})
      expect(scheduledEntries[0].dueTime).to.not.be.null
      expect(scheduledEntries[0].scheduledMessageId).to.not.be.null
    })

    it('push to schedule queue in dead letter on max attempts', async function() {
      // Get the channel
      let recievedMessage = false
      let message = {}
      await channel.assertExchange('orders.test.consumer', 'fanout', {durable: false})
      await channel.bindQueue(QUEUE_NAME, 'orders.test.consumer', '')
      let handler = {
        handle: function(messageObj) {
          recievedMessage = true
          message = messageObj
          throw new Error('error while handling message')
        }
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
      await new Promise(function(resolve, reject) {
        setTimeout(_ => {
          resolve()
        }, 1000)
      })
      expect(recievedMessage).to.be.true
      expect(message.message.content).to.be.eql({hello: 'world'})
      expect(message.message.attemptsMade).to.be.eql(6)
      expect(message.message.killedAt).to.be.not.null
      let scheduledEntries = await scheduleCollection.find({}).toArray()
      expect(scheduledEntries).to.be.empty
      let deadLetterEntries = await deadLetterCollection.find({}).toArray()
      expect(deadLetterEntries).to.be.of.length(1)

      expect(deadLetterEntries[0].content).to.be.eql({hello: 'world'})
      expect(deadLetterEntries[0].attemptsMade).to.be.eql(6)
      expect(deadLetterEntries[0].killedAt).to.be.not.null
      expect(deadLetterEntries[0].dueTime).to.not.be.null
      expect(deadLetterEntries[0].scheduledMessageId).to.not.be.null
    })
  })
})
