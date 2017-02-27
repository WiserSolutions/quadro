const Paths = require('./paths')
const Logger = require('./logger')
const Initializers = require('./initializers')

module.exports = class {
  async initialize() {
    this.name = process.env.npm_package_name
    this.cliParams = require('minimist')(process.argv.slice(2))

    this.log = new Logger(this)
    await this.log.initialize()
    global.log = this.log

    this.appDir = await Paths.appDir()
    this.quadroDir = await Paths.quadroDir()
  }

  async execute() {
    let cmd = this.cliParams._ && this.cliParams._[0] || 'run'

    if (cmd === 'run') return await this.run()
    if (cmd === 'test') {
      const Test = require('./test/test')
      let test = new Test()
      return await test.run()
    }
  }

  async run() {
    await this.runInitializers()
    this.waitForInput()
  }

  async runInitializers() {
    let initializers = new Initializers(this)
    await initializers.run()
  }

  waitForInput() {
    log.info('Ctrl+C to quit')
    process.stdin.resume()
  }
}
