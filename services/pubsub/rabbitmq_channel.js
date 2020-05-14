const amqp = require('amqp-connection-manager')

Q.Errors.declare('PubsubConsomerAlreadyStartedError', 'One Consumer already started. No new consumer can be started again')

async function closeQuietly(closeable) {
  if (closeable) {
    try {
      await closeable.close()
    } catch (err) {
      Q.log.error('Error while closing channel/connection')
    }
  }
}

module.exports = class RabbitMqChannel {
  constructor(host) {
    this.host = host
    this.hostname = require('os').hostname()
    this.serviceName = Q.config.get('service.name', '[unknown]')
  }

  async initialize() {
    this.connection = await amqp.connect(this.host, { heartbeatIntervalInSeconds: 1 })
    this.connection.on('connect', () => Q.log.info('Connected to amqp server'))
    this.connection.on('disconnect', err => Q.log.warn('Disconnected from amqp server', err))
    this.channel = this.connection.createChannel({ json: true })
  }

  async publish(messageType, message) {
    for (let attempt = 0; attempt < 10; attempt++) {
      // TODO: do we really need to try 10 times with the wrapper lib?
      try {
        await this.channel.publish(messageType, '', message, { persistent: true })
        // IDK why this should return true given that "false" is throwing an error, but backwards
        // compatibility time I guess
        return true
      } catch (err) { /* Try again, used `drain` before which is not emitted by this wrapper */ }
    }
    throw new Error('Failing after 10 attempts at putting the message to the amqplib buffer.')
  }

  async startConsumer(queueName, concurrency, messageHandler) {
    if (this.queueName) {
      throw new Q.Errors.PubsubConsomerAlreadyStartedError({
        existingQueue: this.queueName,
        newQueue: queueName
      })
    }

    this.queueName = queueName
    this.concurrency = concurrency
    this.messageHandler = messageHandler

    if (!this.queueName) return
    await this.channel.addSetup(channel => Promise.all([
      // Make sure queue exists
      channel.assertQueue(this.queueName),
      // Set concurrency
      channel.prefetch(this.concurrency),
      // Start the consumer
      channel.consume(this.queueName, this.onMessage.bind(this))
    ]))

    await this.channel.waitForConnect()
    Q.log.info(`Listening to ${this.queueName}`)
  }

  async onMessage(message) {
    // Message would be null if the connection is disconnected or channel is closed
    if (!message) {
      Q.log.error('RabbitMQ channel polled a undefined message.')
      // force reconnection (only known case for this is if a queue is deleted and then recreated)
      await closeQuietly(this.connection._currentConnection)
      return
    }
    console.log('Received message', JSON.parse(message.content.toString()))
    try { // TODO: we should probably remove this try/catch to prevent an infinite loop
      // Process message
      await this.messageHandler(message)
      // Acknowledge message. General error should be taken care by handler
      // and use mongo to schedule event
      await this.channel.ack(message)
    } catch (err) {
      // Unacknowledge only in case there is unhandled message
      await this.channel.nack(message)
    }
  }
}
