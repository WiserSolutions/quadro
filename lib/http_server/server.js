const Koa = require('koa')
const Routes = require('./routes')

module.exports = class {
  constructor(app, container, config, log) {
    this.app = app
    this.log = log
    this.container = container
    this.config = config

    this.koa = new Koa()
    container.register('koa', this.koa, { type: 'value' })

    this.port = config.get('quadro.http.port', 3000)
  }

  async initialize() {
    this.koa.use(require('koa-bodyparser')())

    let routes = await this.container.create(Routes)
    this.koa.use(await routes.build())
  }

  async listen() {
    let port = this.port
    return new Promise((resolve) => {
      let http = this.koa.listen(port, () => {
        this.log.info({ port }, 'HTTP Server listening')
        resolve(this.configure(http))
      })
    })
  }

  configure(http) {
    let timeout = this.config.get('quadro.http.timeout')
    if (timeout) http.setTimeout(timeout)

    return http
  }
}
