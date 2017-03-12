module.exports = class {
  constructor(app, log, container) {
    this.app = app
    this.log = log
    this.container = container
  }

  async run() {
    let files = await this.app.glob('initializers/*.js', { dirs: ['quadro', 'app'] })
    await Promise.map(files, async _ => await this.runInitializer(_))
  }

  async runInitializer(file) {
    this.log.debug({ file }, 'Initializing')
    let Init = require(file)
    if (typeof Init === 'function') {
      try {
        await this.container.create(Init)
      } catch (err) {
        this.log.error({ err, file }, 'Error initializing ')
        throw err
      }
    }
  }
}
