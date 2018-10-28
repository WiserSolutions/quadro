const Router = require('./quadro_router')
const path = require('path')

module.exports = class {
  constructor(app, container, log) {
    this.log = log
    this.app = app
    this.container = container
    this.dirs = [
      path.resolve(this.app.quadroDir),
      path.resolve(this.app.appDir)
    ]
    container.registerSingleton('router', Router)
  }

  async initialize() {
    let controllers = await this.readControllers()
    await this.readRoutes(controllers)
  }

  async readRoutes(controllers) {
    let routeFiles = await this.app.glob('routes/*.js', { dirs: ['quadro', 'app'] })
    await Promise.map(routeFiles, _ => this.container.run(require(_)))
  }

  async readControllers() {
    await Promise.map(this.dirs, _ => this.readControllersFromDir(_))
  }

  async readControllersFromDir(dir) {
    return Promise.each(
      this.app.glob('controllers/**/*_controller.js', { dirs: [dir] }),
      file => this.registerController(dir, file)
    )
  }

  registerController(dir, file) {
    let controllerName = path.relative(dir, file).replace(/^controllers\/|_controller\.js$/g, '')
    this.container.registerSingleton(`controllers:${controllerName}`, require(file))
  }

  async build() {
    return (await this.container.getAsync('router')).routes()
  }
}
