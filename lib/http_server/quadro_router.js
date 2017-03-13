const KoaRouter = require('koa-router')

module.exports = class extends KoaRouter {
  constructor(app, container, log) {
    super()

    this.quadroApp = app
    this.container = container
    this.log = log
  }

  resource(path, controllerName = path) {
    if (!controllerName) throw new Error(`Invalid controller name: ${controllerName}`)
    let controller = this.container.get(`controllers:${controllerName}`)

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
