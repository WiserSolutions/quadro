const amqp = require('amqplib')

module.exports = class Pubsub {
  constructor(log, request, config, hubStats = 'pubsub:hubStats') {
    this.log = log
    this.request = request
    this.config = config
    this.hubStats = hubStats
    this.retryDelay = this.config.get('service.messages.retryDelay', 5000)
  }

  async initialize(retry = false) {
    if (this.config.get('service.messages.host')) {
      try {
      // Get the connection
        this.connection = await amqp.connect(this.config.get('service.messages.host'))

        // On connection close retry to initialize after few minutes
        this.connection.on('close', async (err) => {
          this.log.info({err}, `RabbitMQ connection closed. Retrying to connect after ${this.retryDelay}ms`)
          await this.handleError()
        })

        // Get the channel
        this.channel = await this.connection.createChannel()
        // If channel gets closed adruptly then retry to connect again
        this.channel.on('error', async (err) => {
          this.log.error({err}, `RabbitMQ channel closed. Retrying to connect after ${this.retryDelay}ms`)
          await this.handleError()
        })
      } catch (err) {
        if (retry) {
          this.log.error({err}, `Error while connecting to rabbit mq. Retrying to connect after ${this.retryDelay}ms`)
          this.handleError()
        } else {
          throw err
        }
      }
    }
  }

  async publish(type, content, sendMethod = 'default') {
    let msg = {
      messageType: type,
      content
    }
    if (this.channel && sendMethod !== 'http') {
      let published = await this.channel.publish(msg.messageType, '',
        Buffer.from(JSON.stringify(msg)), { persistent: true })
      if (!published) {
        this.hubStats.increment(msg.messageType, 'rabbitmq_missed')
        throw new Q.Errors.MessagePublishingFailed()
      }
      this.hubStats.increment(msg.messageType, 'published')
    } else {
      let endpoint = this.config.get('quadro.pubsub.endpoint', 'http://hub:8080')
      await this.request({
        forever: true,
        method: 'POST',
        uri: `${endpoint}/api/v1/messages`,
        body: msg,
        json: true
      })
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

Q.Errors.declareError('MessagePublishingFailed', 'Failed to publish message')
