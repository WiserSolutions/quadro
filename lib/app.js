const Paths = require('./paths')
const Logger = require('./logger')
const Config = require('./config')

module.exports = class {
  constructor() {
  }

  async initialize() {
    this.env = process.env.NODE_ENV || 'development'
    this.cliParams = require('minimist')(process.argv.slice(2))
    this.appDir = await Paths.appDir()
    this.quadroDir = await Paths.quadroDir()
    this.name = require(`${this.appDir}/package.json`).name
  }

  async run() {
    this.waitForInput()
  }

  waitForInput() {
    this.log.info('Ctrl+C to quit')
    process.stdin.resume()
  }
}
