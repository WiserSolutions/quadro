const Koa = require('koa')
const Routes = require('./routes')

module.exports = class {
  constructor(app) {
    this.app = app
    this.app.koaApp = new Koa()
    this.port = app.config.get('quadro.http.port', 3000)
  }

  async initialize() {
    this.app.koaApp.use(require('koa-bodyparser')())

    let routes = new Routes(app)
    await routes.initialize()
    this.app.koaApp.use(routes.build())

    await this.listen()
  }

  async listen() {
    let port = this.port
    return new Promise((resolve) => {
      this.app.http = this.app.koaApp.listen(port, function() {
        log.info({ port }, 'HTTP Server listening')
        resolve()
      })
    })
  }
}
