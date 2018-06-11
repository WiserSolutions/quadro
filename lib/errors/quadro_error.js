const { inherits } = require('util')

function QuadroError(...args) {
  Error.captureStackTrace(this, this.constructor)

  args = args || []
  for (let arg of args) {
    if (typeof arg === 'string') {
      this.message = arg
    } else if (arg instanceof Error) {
      this.nestedError = arg
    } else if (typeof arg === 'object') {
      this.extra = arg
    }
  }
  this.message = this.message || this._defaultMessage
  this.extra = { ...this._defaultExtra, ...this.extra }
}

QuadroError.prototype.withExtra = function(extra) {
  const DEFAULT = this._defaultExtra || {}
  this.extra = { ...DEFAULT, ...extra }
  return this
}

QuadroError.prototype.withNested = function(err) {
  this.nestedError = err
  return this
}

inherits(QuadroError, Error)

module.exports = QuadroError
