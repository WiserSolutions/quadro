module.exports = function Handler(log) {
  this.handle = async function(ctx) {
    ctx.success()
  }
}
