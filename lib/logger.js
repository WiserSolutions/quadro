const bunyan = require('bunyan')
const fs = require('fs')
const path = require('path')

/**
 * Make sure to call `.initialize()`
 */
class Logger {
  constructor(app, config) {
    this.app = app
    this.config = config
  }

  async initialize() {
    let logsDir = await this.getOrCreateLogsDir()
    this.logger = bunyan.createLogger({
      name: this.app.name,
      serializers: bunyan.stdSerializers,
      level: this.config.get('quadro.logger.level', 'info'),
      streams: [
        { path: path.resolve(logsDir, 'app.log') },
        { stream: process.stdout }
      ]
    })
  }

  async getOrCreateLogsDir() {
    let logsDir = path.resolve(process.cwd(), 'logs')
    try {
      let stat = fs.statSync(logsDir)
      if (!stat.isDirectory()) {
        console.log(`Fatal: ${logsDir} expected to be a directory`)
        process.exit(1)
      }
    } catch (err) {
      if (err.code !== 'ENOENT') throw err
      console.log(`Warning: Logs directory (${logsDir}) does not exist. Creating.`)
      fs.mkdirSync(logsDir)
    }
    return logsDir
  }

  trace(...args) { this.logger.trace(...args) }
  debug(...args) { this.logger.debug(...args) }
  info(...args) { this.logger.info(...args) }
  warn(...args) { this.logger.warn(...args) }
  error(...args) { this.logger.error(...args) }
}

module.exports = Logger
