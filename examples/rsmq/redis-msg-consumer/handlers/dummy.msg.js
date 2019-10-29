module.exports = function Handler(log) {
  this.handle = async function(ctx) {
    let message = ctx.message
    log.info(message, 'Message received:', message)
    ctx.success()
  }
}
