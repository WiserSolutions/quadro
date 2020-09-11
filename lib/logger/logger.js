const URL = require('url')
const bunyan = require('bunyan')
const fs = require('fs')
const path = require('path')
const _ = require('lodash')

const MetricsLogger = require('./metrics_logger')

/**
 * Make sure to call `.initialize()`
 */
class Logger {
  constructor(app, config) {
    this.app = app
    this.config = config
    this.logToFile = !this.config.get('quadro.logger.noFileLogging')

    this.LogStashStream = require('bunyan-logstash-tcp')
    this.registeredStreams = []
  }

  async initialize() {
    if (this.logToFile) {
      this.logsDir = await this.getOrCreateLogsDir()
    }
    this._auditLogger = this.createAuxiliaryStream('audit')
    this._metricLogger = new MetricsLogger(this.createAuxiliaryStream('metrics'))
    this._eventLogger = this.createAuxiliaryStream('events')

    await this.reload()
  }

  createAuxiliaryStream(name) {
    return bunyan.createLogger(
      this.logToFile
        ? {
          name: this.app.name,
          level: 'info',
          streams: [{ path: path.resolve(this.logsDir, `${name}.log`) }]
        }
        : {
          name: this.app.name,
          type: name, // need a way to distinguish which "stream" it was sent to
          serializers: require('./quadro_serializers'),
          level: 'info'
        }
      )
  }

  createLogstashStream() {
    let logstashHost = this.config.get('quadro.logger.logstash')

    if (!logstashHost) return null
    if (!/tcp:\/\//.test(logstashHost)) {
      const message = `Invalid quadro.logger.logstash url. Should be tcp://`
      throw new Q.Errors.ConfigurationError(message, { logstashHost })
    }

    const LogStashStream = require('bunyan-logstash-tcp')

    let url = URL.parse(logstashHost)
    let options = { host: url.hostname, port: parseInt(url.port) }
    let logstashStream = LogStashStream.createStream(options)
    return { type: 'raw', stream: logstashStream }
  }

  async getStreams() {
    let outStream = process.stdout
    let isTTY = process.stdout && process.stdout.isTTY
    if (isTTY) {
      const QuadroStream = require('./quadro_stream')
      outStream = new QuadroStream()
    }

    const streams = [{ stream: outStream }, ...this.registeredStreams]
    if (this.logsDir) {
      streams.push({ path: path.resolve(this.logsDir, 'app.log') })
    }

    const logstashStream = this.createLogstashStream()
    if (logstashStream) streams.push(logstashStream)

    return streams
  }

  registerStream(stream) {
    this.registeredStreams.push(stream)
    this.logger.addStream(stream)
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

  trace(...args) { this.logger.trace(...this.normalizeParams(...args)) }
  debug(...args) { this.logger.debug(...this.normalizeParams(...args)) }
  info(...args) { this.logger.info(...this.normalizeParams(...args)) }
  warn(...args) { this.logger.warn(...this.normalizeParams(...args)) }
  error(...args) { this.logger.error(...this.normalizeParams(...args)) }

  /**
  * @description Writes an entry to audit log
  *
  * @param {string} action the action performed (example: 'order.pay')
  * @param {string} object the object of the action (example: 'order_1abd')
  * @param {string} status the status of the action (example: declined)
  * @param {string} options.group grouping key
  * @param {Object} options.extra any extra data to attach to the entry
  */
  audit(action, object, status, { group, extra } = {}) {
    this._auditLogger.info({ action, status, object, group, extra })
  }

  /**
  * @description Writes an entry to metrics log
  *
  * @param {string} name - metric name
  * @param {Object} dimensions - metric dimensions (example: { category: 'toy' })
  * @param {Object} vaues - metric values. Only `sum` and `count` keys supported
  */
  metric(name, dimensions, values) {
    this._metricLogger.log(name, dimensions, values)
  }

  /**
  * @description Writes an entry to events log
  *
  * @param {string} type - event type name
  * @param {Object} content - event content
  */
  event(type, content) {
    this._eventLogger.info({ messageType: type, ...content })
  }

  normalizeParams(...args) {
    let obj = args[0]
    if (typeof obj === 'object') {
      obj = this.normalizeObject(obj)
      args[0] = obj
    }
    return args
  }

  normalizeObject(record) {
    return _.mapValues(record, function(value) {
      if (value instanceof Map) {
        let obj = {}
        value.forEach((v, k) => obj[k] = v)
        return obj
      }
      if (value instanceof Set) {
        let obj = []
        value.forEach(v => obj.push(v))
        return obj
      }
      return value
    })
  }
}

module.exports = Logger
