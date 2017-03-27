module.exports = function Handler(log) {
  this.handle = async function(ctx) {
    let message = ctx.message
    log.info(message, 'Got a message')
    if (!message.orderId) throw new Error('No orderId')
    if (message.orderId === 'retry') return ctx.retryAfterSec(60)
    ctx.success()
  }
}
