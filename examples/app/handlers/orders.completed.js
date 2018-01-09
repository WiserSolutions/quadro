module.exports = function Handler(log) {
  this.handle = async function(ctx) {
    let message = ctx.message
    log.info(message, 'Got a message')
    let toReturn
    let processed
    if (!message.orderId) throw new Error('No orderId')
    if (message.orderId === 'fail_with_object') {
      toReturn = ctx.failure({ msg: 'failed with object' })
      processed = true
    } else if (message.orderId === 'ignore_me') {
      toReturn = ctx.ignore({ msg: 'nothing to do' })
      processed = true
    } else if (message.orderId === 'retry') {
      toReturn = ctx.retryAfterSec(60)
      processed = true
    } else if (message.orderId === 'willNotRetry' && ctx.willRetry()) {
      toReturn = ctx.failure({msg: 'message should not have be retried'})
      processed = true
    } else if (message.orderId === 'willRetry' && !ctx.willRetry()) {
      toReturn = ctx.failure({msg: 'message should have been retried'})
      processed = true
    }
    if (processed) return toReturn
    ctx.success()
  }
}
