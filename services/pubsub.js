const RabbitMqChannel = require('./pubsub/rabbitmq_channel')

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
      this.rabbitmqChannel = new RabbitMqChannel(this.config.get('service.messages.host'), this.config.get('service.messages.retryDelay', 5000))
      return this.rabbitmqChannel.initialize()
    }
  }

  async publish(type, content, sendMethod = 'default') {
    let msg = {
      messageType: type,
      content
    }
    if (this.rabbitmqChannel && sendMethod !== 'http') {
      let published = await this.rabbitmqChannel.publish(msg.messageType, msg)
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
}

Q.Errors.declare('MessagePublishingFailed', 'Failed to publish message')
