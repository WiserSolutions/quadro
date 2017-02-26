const Mocha = require('mocha')
const bluebird = require('bluebird')
const glob = bluebird.promisify(require('glob'))

module.exports = class {
  constructor(app) {
    this.app = app
    this.mocha = new Mocha()
      .ui('tdd')
      .reporter('list')
      .useColors(true)
  }

  async runInitializers() {
    let files = await glob('test/initializers/*.js')
    files
      .map(_ => require('path').resolve(process.cwd(), _))
      .forEach(_ => require(`${_}`))
  }

  async addTestFiles() {
    let files = await glob('test/**/*_test.js')
    files.forEach(_ => this.mocha.addFile(_))
  }

  async run() {
    await this.runInitializers()
    await this.addTestFiles()

    this.mocha.run(function(failures) {
      process.on('exit', function () {
        process.exit(failures)  // exit with non-zero status if there were failures
      })
    })
  }
}
