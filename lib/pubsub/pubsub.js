module.exports = class {
  constructor(request, log, config) {
    this.log = log
    this.request = request
    this.config = config
  }

  async publish(type, content) {
    let msg = {
      messageType: type,
      content
    }
    let endpoint = this.config.get('quadro.pubsub.endpoint', 'http://hub:8080')
    await this.request({
      method: 'POST',
      uri: `${endpoint}/api/v1/messages`,
      body: msg,
      json: true
    })
  }
}
