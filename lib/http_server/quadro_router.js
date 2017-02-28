const KoaRouter = require('koa-router')

module.exports = class extends KoaRouter {
  constructor(app, controllers) {
    super()

    this.quadroApp = app
    this.quadroControllers = controllers
  }

  applyRoute(route) {
    if (typeof route !== 'function') return

    route(this, this.quadroApp)
  }

  resource(path, controller) {
    if (!controller) {
      let desc = this.quadroControllers.find(_ => this.isControllerForPath(path, _))
      if (!desc) {
        log.error(`Unable to infer controller for path '${path}'`)
        process.exit(1)
      }
      let Controller = require(desc.file)
      controller = typeof Controller === 'function' ?
        new Controller(this.quadroApp) :
        Controller
    }

    if (controller.show) this.get(`/${path}/:id`, controller.show)
    if (controller.update) this.put(`/${path}/:id`, controller.update)
    if (controller.index) this.get(`/${path}`, controller.index)
    if (controller.destroy) this.delete(`/${path}/:id`, controller.destroy)
    if (controller.create) this.post(`/${path}`, controller.create)
  }

  isControllerForPath(path, controller) {
    return path === controller.name
  }
}
