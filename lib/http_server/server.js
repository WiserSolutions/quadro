const Koa = require('koa')
const Routes = require('./routes')

module.exports = class {
  constructor(app, container, config, log, prometheus) {
    this.app = app
    this.log = log
    this.container = container
    this.config = config
    this.metrics = {
      responseTime: new prometheus.Histogram({
        name: `${prometheus.prefix}http_resonse_time`,
        help: 'HTTP response time',
        labelNames: ['path']
      }),
      responseSentiment: new prometheus.Counter({
        name: `${prometheus.prefix}http_sentiment_count`,
        help: 'HTTP response sentiment counts (i.e. 1xx, 2xx, 3xx, 4xx, 5xx)',
        labelNames: ['path', 'sentiment']
      })
    }

    this.koa = new Koa()
    container.register('koa', this.koa, { type: 'value' })

    this.port = config.get('quadro.http.port', 3000)
  }

  async initialize() {
    const enableKoaBodyParser = await this.config.get('quadro.middleware.koa-body.enabled', true)

    if (enableKoaBodyParser) {
      const koaBody = require('koa-body')
      const defaultOptions = {
        jsonLimit: '10mb',
        textLimit: '10mb',
        formLimit: '10mb',
        multipart: true
      }
      const configOptions = await this.config.get('quadro.middleware.koa-body.options', {})
      const options = { ...defaultOptions, ...configOptions }
      this.koa.use(koaBody(options))
    }

    this.koa.use(async (ctx, next) => {
      const timer = this.metrics.responseTime.startTimer({path: ctx.req.path})
      await next()
      timer()
      if (ctx.status < 200) {
        this.metrics.responseSentiment.inc({path: ctx.req.path, sentiment: '1xx'})
      } else if (ctx.status < 300) {
        this.metrics.responseSentiment.inc({path: ctx.req.path, sentiment: '2xx'})
      } else if (ctx.status < 400) {
        this.metrics.responseSentiment.inc({path: ctx.req.path, sentiment: '3xx'})
      } else if (ctx.status < 500) {
        this.metrics.responseSentiment.inc({path: ctx.req.path, sentiment: '4xx'})
      } else {
        this.metrics.responseSentiment.inc({path: ctx.req.path, sentiment: '5xx'})
      }
    })

    await this.app.emit('routes-will-load', { quadroHttpServer: this })

    let routes = await this.container.create(Routes)
    this.koa.use(await routes.build())

    await this.app.emit('routes-did-load', { quadroHttpServer: this })
  }

  async listen() {
    let port = this.port
    return new Promise(resolve => {
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
