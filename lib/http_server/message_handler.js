class MessageContext {
  constructor(envelope, ctx, container, log) {
    this.envelope = envelope
    let message = envelope.content
    this.messageType = envelope.type || envelope.messageType
    this.message = message
    this.ctx = ctx
    this.log = log
    this.container = container
  }

  success() {
    this.ctx.status = 200
  }

  failure(err) {
    this.ctx.status = 500
    this.ctx.body = err.message
  }

  retryAfterSec(seconds, reason) {
    this.ctx.set('retry-after', seconds)
    this.ctx.body = reason
    this.ctx.status = 307
  }
}

module.exports = function(handlerFunc, container) {
  this.handle = async function(ctx) {
    let envelope = ctx.request.body
    let log = await container.get('log')
    let msgContext = new MessageContext(envelope, ctx, container, log)
    await handlerFunc.apply(msgContext)
      .catch(function(err) {
        log.error({ err, messageType: msgContext.messageType }, 'Message handler failed')
        msgContext.failure(err)
      })
  }
}
