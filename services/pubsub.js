const amqp = require('amqplib')

module.exports = class Pubsub {
  constructor(log, request, config, hubStats = 'pubsub:hubStats') {
    this.log = log
    this.request = request
    this.config = config
    this.hubStats = hubStats
  }

  async initialize() {
    if (this.config.get('service.messages.host')) {
      // Get the connection
      let connection = await amqp.connect(this.config.get('service.messages.host'))
      // Get the channel
      this.channel = await connection.createChannel()
    }
  }

  async publish(type, content, sendMethod = 'default') {
    let msg = {
      messageType: type,
      content
    }
    if (this.channel && sendMethod !== 'http') {
      let published = await this.channel.publish(msg.messageType, '',
        Buffer.from(JSON.stringify(msg)))
      if (!published) {
        this.hubStats.increment(msg.messageType, 'rabbitmq_missed')
        throw new Q.Errors.MessagePublishingFailed()
      } else {
        this.hubStats.increment(msg.messageType, 'published')
      }
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

Q.Errors.declareError('MessagePublishingFailed', 'Failed to publish message')
