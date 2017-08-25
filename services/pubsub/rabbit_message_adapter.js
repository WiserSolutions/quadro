const amqp = require('amqplib')

module.exports = class RabbitMqMessageAdapter {
  constructor(log, config, messageProcessor = 'pubsub:hubMessageProcessor') {
    this.log = log
    this.config = config
    this.messageProcessor = messageProcessor
    this.retryDelay = this.config.get('service.messages.retryDelay', 1000)
  }

  async initialize(retry = false) {
    this.closeQuitely(this.channel)
    this.closeQuitely(this.connection)
    // If consumer configs are not present then don't initialize it
    let serviceName = this.config.get('service.name')
    if (!serviceName) {
      return
    }
    // Get the queue name
    let queueName = this.config.get('service.messages.input', `${serviceName}_in`)
    let amqpUrl = this.config.get('service.messages.host')

    try {
    // Get the connection
      this.connection = await amqp.connect(amqpUrl)

      // On connection close retry to initialize after few minutes
      this.connection.on('close', async (err) => {
        this.log.info({err}, `RabbitMQ connection closed. Retrying to connect after ${this.retryDelay}ms`)
        await this.handleError()
      })
      // Get the channel
      this.channel = await this.connection.createChannel()
      // Make sure queue exists
      await this.channel.assertQueue(queueName)
      // set the concurrency
      await this.channel.prefetch(this.config.get('service.messages.concurrency', 10))

      // If channel gets closed adruptly then retry to connect again
      this.channel.on('error', async (err) => {
        this.log.error({err}, `RabbitMQ channel closed. Retrying to connect after ${this.retryDelay}ms`)
        await this.handleError()
      })

      // start the consumer
      await this.channel.consume(queueName, async (message) => {
        // Message would be null if the connection is disconnected or channel is closed
        if (!message) {
          await this.handleError()
          return
        }
        try {
        // Process message
          await this.messageProcessor.handleProcessing(message)
          // Acknowledge message. General error should be taken care by handler
          // and use mongo to schedule event
          await this.channel.ack(message)
        } catch (err) {
        // Unacknowledge only in case there is unhandled message
          await this.channel.nack(message)
        }
      })
    } catch (err) {
      if (retry) {
        this.log.error({err}, `Error while connecting. Retrying to connect after ${this.retryDelay}ms`)
        this.handleError()
      } else throw err
    }
  }

  async handleError() {
    await this.closeQuitely(this.channel)
    await this.closeQuitely(this.connection)
    setTimeout(() => this.initialize(true), this.retryDelay)
  }

  async closeQuitely(closeable) {
    if (closeable) {
      try {
        await closeable.close()
      } catch (err) {
        this.log.error({err}, 'Error while closing channel/connection')
      }
    }
  }
}
