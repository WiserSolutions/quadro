const Mocha = require('mocha')
const bluebird = require('bluebird')
const glob = bluebird.promisify(require('glob'))
const path = require('path')

module.exports = class {
  constructor(app) {
    this.app = app
    this.mocha = new Mocha()
      .ui('tdd')
      .reporter('list')
      .useColors(true)

    global.expect = require('chai').expect
    require('co-mocha')
  }

  async addInitializers() {
    let files = (await glob('test/initializers/*.js'))
      .concat(await glob(path.join(__dirname, 'initializers/*.js')))
      .forEach(_ => this.mocha.addFile(_))
  }

  async addTestFiles() {
    let files = await glob('test/**/*_test.js')
    files.forEach(_ => this.mocha.addFile(_))
  }

  async run() {
    await this.addInitializers()
    await this.addTestFiles()

    this.mocha.run(function(failures) {
      process.on('exit', function () {
        process.exit(0)
      })
    })
  }
}
