module.exports = class HubMessageConsumer {
  constructor(
    processor = 'pubsub:hubMessageProcessor',
    handlers = 'pubsub:handlersList') {
    this.processor = processor
    this.handlers = handlers
  }

  async initialize() {
    return this.initailizeHandlers()
  }

  async initailizeHandlers() {
    await Promise.map(
      this.handlers,
      ({ handler, type }) => this.processor.register(type, handler)
    )
  }
}
