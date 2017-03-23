const Mocha = require('mocha')
const path = require('path')

module.exports = class {
  constructor(app, container, log) {
    this.container = container
    this.log = log
    this.app = app
    this.mocha = new Mocha()
      .ui('tdd')
      .reporter('spec')
      .useColors(true)

    let chai = require('chai')
    global.expect = chai.expect
    require('co-mocha')
    chai.use(require('sinon-chai'))
    chai.use(require('chai-as-promised'))

    global.QT = {}
  }

  async addTestFiles() {
    let files = await this.app.glob('test/**/*_test.js')
    files.forEach(_ => this.mocha.addFile(_))
  }

  async run() {
    global.container = this.container
    this.mocha.addFile(path.join(__dirname, './initialize_tests.js'))
    await this.addTestFiles()

    this.mocha.run(function(failures) {
      process.exit(failures > 0 ? 1 : 0)
    })
  }
}
