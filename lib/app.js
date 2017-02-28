const Paths = require('./paths')
const Logger = require('./logger')
const Config = require('./config')

module.exports = class {
  async initialize() {
    this.env = process.env.NODE_ENV || 'dev'
    this.cliParams = require('minimist')(process.argv.slice(2))
    this.appDir = await Paths.appDir()
    this.quadroDir = await Paths.quadroDir()
    this.name = require(`${this.appDir}/package.json`).name //process.env.npm_package_name

    this.config = new Config(this)
    await this.config.initialize()

    this.log = new Logger(this)
    await this.log.initialize()
    global.log = this.log

    await this.watch()
  }

  async watch() {
    if (!this.cliParams.watch) return

    const Watcher = require('./watcher')
    let watcher = new Watcher(this)
    await watcher.run()
  }

  async execute() {
    await this.runInitializers()

    let cmd = this.cliParams._ && this.cliParams._[0] || 'run'

    if (cmd === 'run') return await this.run()
    if (cmd === 'test') {
      const Test = require('./test/test')
      let test = new Test()
      return await test.run()
    }
  }

  async run() {
    this.waitForInput()
  }

  async runInitializers() {
    const Initializers = require('./initializers')
    let initializers = new Initializers(this)
    await initializers.run()
  }

  waitForInput() {
    log.info('Ctrl+C to quit')
    process.stdin.resume()
  }
}
