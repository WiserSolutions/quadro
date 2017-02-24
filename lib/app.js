const Paths = require('./paths')
const Logger = require('./logger')

module.exports = class {
  async initialize() {
    this.name = process.env.npm_package_name

    this.log = new Logger(this)
    global.log = this.log

    this.appDir = await Paths.appDir()
    this.quadroDir = await Paths.quadroDir()
  }

  async run() {
    this.waitForInput()
  }

  waitForInput() {
    log.info('Ctrl+C to quit')
    process.stdin.resume()
  }
}
