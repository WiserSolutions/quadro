const URL = require('url')
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
    app.on('loaded', async () => {
      await this.reload()
    })

    this.LogStashStream = require('bunyan-logstash-tcp')
  }

  async initialize() {
    this.logsDir = await this.getOrCreateLogsDir()
    await this.reload()
  }

  async getStreams() {
    let outStream = process.stdout
    let isTTY = process.stdout && process.stdout.isTTY
    if (isTTY) {
      const QuadroStream = require('./quadro_stream')
      outStream = new QuadroStream()
    }
    let streams = [
      { path: path.resolve(this.logsDir, 'app.log') },
      { stream: outStream }
    ]

    let logstashHost = this.config.get('quadro.logger.logstash')
    if (logstashHost) {
      if (!/:\/\//.test(logstashHost)) {
        throw new Error(`Invalid quadro.logger.logstash url: ${logstashHost}. Should be tcp://`)
      }
      let url = URL.parse(logstashHost)
      let options = { host: url.hostname, port: parseInt(url.port) }
      let logstashStream = this.LogStashStream.createStream(options)
      streams.push({ type: 'raw', stream: logstashStream })
    }

    return streams
  }

  async reload() {
    this.logger = bunyan.createLogger({
      name: this.app.name,
      serializers: require('./quadro_serializers'),
      level: this.config.get('quadro.logger.level', 'info'),
      streams: await this.getStreams()
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
