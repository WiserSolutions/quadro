const amqp = require('amqplib')
Q.Errors.declare('PubsubConsomerAlreadyStartedError', 'One Consumer already started. No new consumer can be started again')

module.exports = class RabbitMqChannel {
  constructor(host, retryDelay) {
    this.host = host
    this.retryDelay = retryDelay
    this.hostname = require('os').hostname()
    this.serviceName = Q.config.get('service.name', '[unknown]')
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
        Q.log.error({err}, `There was an error in rabbitmq connection. Retrying to connect after ${this.retryDelay}ms`)
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
    const messageAccepted = this.channel.publish(messageType, '',
      Buffer.from(JSON.stringify(message)), { persistent: true })

    if (messageAccepted === false) {
      Q.log.metric('quadro_rabbit_await_drain', {
        messageType,
        hostname: this.hostname,
        service: this.serviceName
      }, { count: 1 })
      const waitStart = Date.now()
      await new Promise(resolve => this.channel.once('drain', resolve))
      Q.log.metric('quadro_rabbit_await_drain_time', {
        messageType,
        hostname: this.hostname,
        service: this.serviceName
      }, { sum: Date.now() - waitStart })
    }

    return true
  }

  async startConsumer(queueName, concurrency, messageHandler) {
    if (!this.queueName) {
      this.queueName = queueName
      this.concurrency = concurrency
      this.messageHandler = messageHandler
      return this._startConsumerInternal()
    } else {
      throw new Q.Errors.PubsubConsomerAlreadyStartedError({existingQueue: this.queueName, newQueue: queueName})
    }
  }

  async _startConsumerInternal() {
    if (!this.queueName) return
    // Make sure queue exists
    await this.channel.assertQueue(this.queueName)

    // Set concurrency
    await this.channel.prefetch(this.concurrency)

    // start the consumer
    await this.channel.consume(this.queueName, async (message) => {
      // Message would be null if the connection is disconnected or channel is closed
      if (!message) {
        Q.log.error(`RabbitMQ channel polled a undefined message. Most likely connection is disconnected or channel is closed. Retrying to connect after ${this.retryDelay}ms`)
        await this.handleError()
        return
      }
      try {
        // Process message
        await this.messageHandler(message)
        // Acknowledge message. General error should be taken care by handler
        // and use mongo to schedule event
        await this.channel.ack(message)
      } catch (err) {
        // Unacknowledge only in case there is unhandled message
        await this.channel.nack(message)
      }
    })
  }

  async handleError() {
    await this.closeQuitely(this.channel)
    await this.closeQuitely(this.connection)
    setTimeout(async () => {
      await this.initialize(true)
      await this._startConsumerInternal()
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
