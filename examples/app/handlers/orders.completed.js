module.exports = async function() {
  let message = this.message
  this.log.info('Got a message')
  if (!message.orderId) throw new Error('No orderId')
  if (message.orderId === 'retry') return this.retryAfterSec(60)
  this.success()
}
