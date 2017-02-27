const bluebird = require('bluebird')
const glob = bluebird.promisify(require('glob'))
const path = require('path')
const _ = require('lodash')

module.exports = class {
  constructor(app) {
    this.app = app
  }

  async run() {
    for (let dir of [this.app.quadroDir, this.app.appDir]) {
      let files = await glob(`${dir}/initializers/*.js`)
      await Promise.all(files.map(async _ => await this.initialize(_)))
    }
  }

  async initialize(file) {
    let Init = require(file)
    if (typeof Init === 'function') {
      await Init(this.app)
    }
  }
}
