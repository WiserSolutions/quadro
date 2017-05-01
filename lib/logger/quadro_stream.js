require('colors')
const prettyjson = require('prettyjson')
const IGNORED_ATTRS = ['name', 'hostname', 'level', 'msg', 'v', 'pid']
const _ = require('lodash')
const moment = require('moment')

module.exports = class {
  constructor() {
    this.appDir = Q.app.appDir
  }

  write(record) {
    record = JSON.parse(record)

    let time = this.formatTime(record)
    let msg = record.msg || ''
    let msgColor = this.getLevelColor(record.level)

    let err = record.err
    if (err) delete record.err

    let message = this.buildMessage(time, msg)

    record = _.omit(record, IGNORED_ATTRS)
    let details = this.buildDetails(record, message.length)

    message = this.buildMessage(time, msg[msgColor], details)
    console.log(message)

    if (!_.isEmpty(record)) {
      console.log(prettyjson.render(record, {}, 2))
    }

    if (err) this.showError(err)
  }

  buildDetails(record, usedLineLength) {
    let lineLength = process.stdout.columns
    let maxLen = Math.floor(lineLength - usedLineLength)
    let details = _(record)
      .map((value, key) => {
        key = (key || '').toString()
        let valueString = _.isNil(value) ? '' : value.toString()
        let l = this.isLiteral(value) ? key.length + valueString.length + 5 : 9999
        return { key, value, l }
      })
      .sortBy(p => p.l)
      .transform((acc, { key, value, l }) => {
        if (maxLen < l) return false
        acc[key] = value
        delete record[key]
        maxLen -= l
      }, {})
      .value()
    return this.formatDetails(details)
  }

  formatDetails(details) {
    let s = _.map(details, function(value, key) {
      if (value) value = typeof value === 'number' ? value.toString().yellow : value.cyan
      return `${key.green}: ${value}`
    }, '').join(', ')
    if (s.length) return `( ${s} )`
  }

  isLiteral(v) { return typeof v === 'string' || typeof v === 'number' }

  buildMessage() {
    return [...arguments].join('   ')
  }

  getLevelColor(level) {
    if (level <= 10) return 'cyan'
    if (level <= 20) return 'yellow'
    if (level <= 30) return 'green'
    if (level <= 40) return 'magenta'
    if (level <= 50) return 'red'
    return 'white'
  }

  formatTime(record) {
    let now = moment(record.time)
    delete record.time
    return now.format('HH:mm:ss:SSS')
  }

  showError(err) {
    let name = err.name || 'Error'
    let msg = err.message || ''
    let header = `${name}: ${msg}`
    let details = this.buildDetails(err.extra, header.length)
    console.log(header.red.bold, details || '')
    let frames = (err.stack || '').split('\n')
    frames.forEach(f => console.log(this.formatFrame(f)))
  }

  formatFrame(frame) {
    frame = '    ' + _.trimStart(frame)
    let isModule = frame.includes('node_modules/')
    if (isModule) return frame.grey
    frame = frame.cyan
    let belongsToApp = frame.includes(this.appDir)
    if (belongsToApp) return frame.bold
    return frame
  }
}
