module.exports = function ConfigController(config) {
  this.show = async function(ctx) {
    let value = await config.get(ctx.params.id)
    ctx.body = { value }
  }

  this.update = async function(ctx) {
    let key = ctx.params.id
    let value = ctx.request.body.value
    await config.set(key, value)
    ctx.status = 204
  }
}
