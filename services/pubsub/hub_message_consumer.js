const path = require('path')

module.exports = class HubMessageConsumer {
  constructor(app, container, hubMessageProcessor = 'pubsub:hubMessageProcessor') {
    this.hubMessageProcessor = hubMessageProcessor
    this.app = app
    this.container = container
  }

  async initialize() {
    return this.initailizeHandlers()
  }

  async initailizeHandlers() {
    await Promise.map(
      this.app.glob(`handlers/*.js`),
      async (file) => {
        let handler = await this.container.create(require(file))
        let messageType = this.getMessageName(file)
        await this.hubMessageProcessor.register(messageType, handler)
      }
    )
  }

  getMessageName(file) {
    return path.basename(file, '.js')
  }
}
