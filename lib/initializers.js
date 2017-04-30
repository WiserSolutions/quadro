module.exports = class {
  constructor(app, log, container) {
    this.app = app
    this.log = log
    this.container = container
  }

  async run() {
    let files = this.app.glob('initializers/*.js', { dirs: ['quadro', 'app'] })
    return Promise.map(files, _ => this.runInitializer(_))
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
}
