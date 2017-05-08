const path = require('path')
module.exports = class {
  constructor(app, log, container, config) {
    this.app = app
    this.log = log
    this.container = container
    this.config = config
  }

  async run() {
    let files = this.app.glob('initializers/*.js', { dirs: ['quadro', 'app'] })
    return Promise.filter(files, _ => this.shouldInitialize(_)).map(_ => this.runInitializer(_))
  }

  async runInitializer(file) {
    Q.profiler.profile({ file }, `Initializer`, async () => {
      let Init = require(file)
      if (typeof Init === 'function') {
        try {
          await this.container.create(Init)
        } catch (err) {
          this.log.error({ err, file }, 'Error initializing. Stopping...')
          process.exit(1)
        }
      }
    })
  }

  async shouldInitialize(file) {
    return this.config.get(`quadro.initializers.${path.basename(file, path.extname(file))}`, true)
  }
}
