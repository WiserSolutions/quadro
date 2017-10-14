const Mocha = require('mocha')
const path = require('path')

module.exports = class {
  constructor(app, container, log, config) {
    this.container = container
    this.log = log
    this.app = app
    this.config = config

    this.mocha = new Mocha(this.getMochaOptions())
      .ui('tdd')
      .reporter('spec')
      .useColors(true)
  }

  getMochaOptions() {
    let options = {
      timeout: this.config.get('quadro.test.timeout', 2000)
    }

    return options
  }

  async addTestFiles() {
    let files = await this.app.glob('test/**/*_test.js')
    files.forEach(_ => this.mocha.addFile(_))
  }

  async run() {
    this.mocha.addFile(path.join(__dirname, './initialize_tests.js'))
    await this.addTestFiles()

    let runner = this.mocha.run((failures) => {
      if (global.coverage) global.coverage.report()
      process.exit(failures > 0 ? 1 : 0)
    })
    runner.on('fail', function(test, err) {
      let extra = err.extra
      if (extra) Q.log.error({ extra, test: test.title }, 'Extra error details')
    })
  }
}
