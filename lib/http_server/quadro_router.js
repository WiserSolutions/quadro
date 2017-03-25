const KoaRouter = require('koa-router')

module.exports = class extends KoaRouter {
  constructor(app, container, log) {
    super()

    this.quadroApp = app
    this.container = container
    this.log = log
  }

  async resource(path, controllerName = path) {
    if (!controllerName) throw new Error(`Invalid controller name: ${controllerName}`)
    let controller = await this.container.getAsync(`controllers:${controllerName}`)

    this.registerRESTPath('get', 'index', `/${path}`, controller)
    this.registerRESTPath('get', 'show', `/${path}/:id`, controller)
    this.registerRESTPath('put', 'update', `/${path}/:id`, controller)
    this.registerRESTPath('delete', 'destroy', `/${path}/:id`, controller)
    this.registerRESTPath('post', 'create', `/${path}`, controller)
  }

  isControllerForPath(path, controller) {
    return path === controller.name
  }

  registerRESTPath(verb, method, path, controller) {
    if (!controller[method]) return
    this[verb](path, controller[method].bind(controller))
  }
}
