module.exports = class {
  constructor(container) {
    this.container = container
  }

  async index(ctx) {
    let healthcheck = await this.container.tryAsync('healthcheck')
    if (!healthcheck) return ctx.status = 200

    try {
      let isHealthy = await healthcheck.run()
      ctx.status = isHealthy ? 200 : 500
    } catch (err) {
      ctx.body = {
        error: {
          message: err.message,
          extra: err.extra
        }
      }
      ctx.status = 500
    }
  }
}
