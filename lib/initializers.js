const path = require('path')
module.exports = class {
  constructor(app, log, container, config) {
    this.app = app
    this.log = log
    this.container = container
    this.config = config
  }

  async run() {
    let files = this.app.glob('initializers/*.js', { dirs: ['quadro', 'app', 'plugins'] })
    return Promise.map(files, _ => this.runInitializer(_))
  }

  async runInitializer(file) {
    // Check if the initializer is enabled
    if (!this.config.get(`quadro.initializers.${path.basename(file, path.extname(file))}`, true)) return
    // execute initilizer with profiler
    await Q.profiler.profile({ file }, `Initializer`, async () => {
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
