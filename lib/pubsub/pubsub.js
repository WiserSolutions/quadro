module.exports = class {
  constructor(request, log) {
    this.log = log
    this.request = request
  }

  async publish(type, content) {
    let msg = {
      messageType: type,
      content
    }
    await this.request({
      method: 'POST',
      uri: 'http://hub:8080/api/v1/messages',
      body: msg,
      json: true
    })
  }
}
