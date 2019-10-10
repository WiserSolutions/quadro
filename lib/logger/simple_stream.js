require('colors')
const prettyjson = require('prettyjson')
const IGNORED_ATTRS = ['name', 'hostname', 'level', 'msg', 'v', 'pid']
const _ = require('lodash')

module.exports = class {
  constructor() {
    this.appDir = Q.app.appDir
  }

  write(record) {
    record = JSON.parse(record)

    let msg = record.msg || ''

    let err = record.err
    if (err) delete record.err

    record = _.omit(record, IGNORED_ATTRS)

    let logentry = this.buildMessage(msg)

    if (!_.isEmpty(record)) {
      logentry += _.chain(prettyjson.render(record, {}, 2))
        .split('\n')
        .map(line => '    ' + line)
        .join('\n')
        .value()
    }

    console.log(logentry)

    if (err) this.showError(err)
  }

  buildDetails(record, usedLineLength) {
    let lineLength = process.stdout.columns || 80
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

  isLiteral(v) { return typeof v === 'string' || typeof v === 'number' }

  buildMessage() {
    return [...arguments].join('   ')
  }

  showError(err, level = 0) {
    let padding = _.repeat('    ', level)
    let name = err.name || 'Error'
    let msg = err.message || ''
    let header = `${name}: ${msg}`
    let details = this.buildDetails(err.extra, header.length)
    console.log(padding, header.red.bold, details || '')
    let frames = (err.stack || '').split('\n')
    frames.forEach(f => console.log(padding, this.formatFrame(f)))

    if (err.nestedError) {
      this.showError(err.nestedError, level + 1)
    }
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
