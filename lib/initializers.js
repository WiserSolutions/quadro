const bluebird = require('bluebird')
const glob = bluebird.promisify(require('glob'))
const path = require('path')
const _ = require('lodash')

module.exports = class {
  constructor(app, log, container) {
    this.app = app
    this.log = log
    this.container = container
  }

  async run() {
    for (let dir of [this.app.quadroDir, this.app.appDir]) {
      let files = await glob(`${dir}/initializers/*.js`)
      await Promise.all(files.map(async _ => await this.runInitializer(_)))
    }
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
