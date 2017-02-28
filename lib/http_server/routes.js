const Router = require('./quadro_router')
const path = require('path')
const bluebird = require('bluebird')
const glob = bluebird.promisify(require('glob'))
const _ = require('lodash')

module.exports = class {
  constructor(app) {
    this.app = app
    this.dirs = [
      path.resolve(this.app.quadroDir),
      path.resolve(this.app.appDir)
    ]
  }

  async initialize() {
    let controllers = await this.readControllers()
    let routes = await this.readRoutes(controllers)
  }

  async readRoutes(controllers) {
    this.router = new Router(this.app, controllers)

    let routes = _.flatten(await Promise.all(
      this.dirs.map(async _ => await glob(`${_}/routes/*.js`))
    ))
    .map(_ => require(_))
    .forEach(_ => this.router.applyRoute(_))
  }

  async readControllers() {
    let controllers = _.flatten(await Promise.all(
      this.dirs.map(async _ => await this.readControllersFromDir(_))
    ))

    return controllers
  }

  async readControllersFromDir(dir) {
    let files = await glob(`${dir}/controllers/**/*_controller.js`)
    return files.map((file) => ({
      dir,
      file,
      name: this.getControllerName(file, path.join(dir, 'controllers') )
    }))
  }

  getControllerName(file, dir) {
    return path.relative(dir, file)
      .replace(/_controller\.js$/, '')
  }

  build() {
    return this.router.routes()
  }
}
