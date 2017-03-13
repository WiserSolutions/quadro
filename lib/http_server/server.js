const Koa = require('koa')
const Routes = require('./routes')

module.exports = class {
  constructor(app, container, config, log) {
    this.app = app
    this.log = log
    this.container = container

    this.koa = new Koa()
    container.register('koa', this.koa)

    this.port = config.get('quadro.http.port', 3000)
  }

  async initialize() {
    this.koa.use(require('koa-bodyparser')())

    let routes = await this.container.create(Routes)
    this.koa.use(await routes.build())

    await this.listen()
  }

  async listen() {
    let port = this.port
    return new Promise((resolve) => {
      let http = this.koa.listen(port, () => {
        this.log.info({ port }, 'HTTP Server listening')
        resolve(true)
      })
      this.container.register('httpServer', http)
    })
  }
}
