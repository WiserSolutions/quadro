module.exports = async function(message) {
  if (!message.orderId) throw new Error('No orderId')
  if (message.orderId === 'retry') return this.retryAfterSec(60)
  this.success()
}
