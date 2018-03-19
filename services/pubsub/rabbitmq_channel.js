const amqp = require('amqplib')

module.exports = class RabbitMqChannel {
  constructor(host, retryDelay) {
    this.host = host
    this.retryDelay = retryDelay
  }

  async initialize(retry = false) {
    try {
      this.connection = await amqp.connect(this.host)

      // On connection close retry to initialize after few minutes
      this.connection.on('close', async (err) => {
        Q.log.info({err}, `RabbitMQ connection closed. Retrying to connect after ${this.retryDelay}ms`)
        await this.handleError()
      })

      // Get the channel
      this.channel = await this.connection.createChannel()
      // If channel gets closed adruptly then retry to connect again
      this.channel.on('error', async (err) => {
        Q.log.error({err}, `RabbitMQ channel closed. Retrying to connect after ${this.retryDelay}ms`)
        await this.handleError()
      })
    } catch (err) {
      if (retry) {
        Q.log.error({err}, `Error while connecting to rabbit mq. Retrying to connect after ${this.retryDelay}ms`)
        this.handleError()
      } else {
        throw err
      }
    }
  }

  async publish(messageType, message) {
    return this.channel.publish(messageType, '',
      Buffer.from(JSON.stringify(message)), { persistent: true })
  }

  async startConsumer(queueName, concurrency, messageHandler) {
    // Make sure queue exists
    await this.channel.assertQueue(queueName)

    // Set concurrency
    await this.channel.prefetch(concurrency)

    // start the consumer
    await this.channel.consume(queueName, async (message) => {
      // Message would be null if the connection is disconnected or channel is closed
      if (!message) {
        await this.handleError(queueName, concurrency, messageHandler)
        return
      }
      try {
        // Process message
        await messageHandler(message)
        // Acknowledge message. General error should be taken care by handler
        // and use mongo to schedule event
        await this.channel.ack(message)
      } catch (err) {
        // Unacknowledge only in case there is unhandled message
        await this.channel.nack(message)
      }
    })
  }

  async handleError(queueName, concurrency, messageHandler) {
    await this.closeQuitely(this.channel)
    await this.closeQuitely(this.connection)
    setTimeout(async () => {
      await this.initialize(true)
      if (queueName) this.startConsumer(queueName, concurrency, messageHandler)
    }, this.retryDelay)
  }

  async closeQuitely(closeable) {
    if (closeable) {
      try {
        await closeable.close()
      } catch (err) {
        Q.log.error('Error while closing channel/connection')
      }
    }
  }
}
