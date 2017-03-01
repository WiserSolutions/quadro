class MessageContext {
  constructor(messageType, ctx) {
    this.messageType = messageType
    this.ctx = ctx
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

module.exports = function(messageType, handlerFunc) {
  this.handle = async function(ctx) {
    let msgContext = new MessageContext(messageType, ctx)
    let message = ctx.request.body
    log.info({ message })
    await handlerFunc.apply(msgContext, [message])
      .catch(function(err) {
        log.error({ err, messageType }, 'Message handler failed')
        msgContext.failure(err)
      })
  }
}
