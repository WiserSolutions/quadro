const bunyan = require('bunyan')

class Logger {
  constructor(app) {
    this.logger = bunyan.createLogger({
      name: app.name,
      serializers: bunyan.stdSerializers
    })
  }

  trace(...args) { this.logger.trace(...args) }
  debug(...args) { this.logger.debug(...args) }
  info(...args) { this.logger.info(...args) }
  warn(...args) { this.logger.warn(...args) }
  error(...args) { this.logger.error(...args) }
}

module.exports = Logger
