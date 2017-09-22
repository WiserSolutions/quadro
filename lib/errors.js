const { inherits } = require('util')

module.exports = class {
  constructor() {
    this.declareError('ReadOnlyPropertyError', function(property) {
      this.message = `Unable to set read-only property '${property}'`
      this.extra = { property }
    })

    this.declareError('ValidationError', function(message) {
      this.message = message
    })

    this.declareError('InvalidArgumentError', 'Invalid argument')
    this.declareError('InvalidOperation')
    this.declareError('NotImplementedError', function(method) {
      this.message = `'${method}' is not implemented`
      this.extra = { method }
    })
  }

  declareError(name, message, initializer) {
    let defaultMessage = ''
    if (!initializer) {
      if (typeof message === 'function') initializer = message
      if (typeof message === 'string') defaultMessage = message
    }
    let errorName = name
    this[errorName] = function(message, extra) {
      Error.captureStackTrace(this, this.constructor)

      if (typeof message !== 'string') {
        extra = message
        message = defaultMessage
      }
      this.name = errorName
      this.message = message
      this.extra = {}
      if (extra && !(extra instanceof Error)) {
        this.extra = extra
      }

      let nArgs = arguments.length
      if (nArgs > 0 && arguments[nArgs - 1] instanceof Error) {
        this.nestedError = arguments[nArgs - 1]
      }
      if (initializer) initializer.apply(this, [message, extra])
    }
    inherits(this[errorName], Error)
    this[errorName].prototype.name = errorName

    // Allow error name to be visible in assertions
    Object.defineProperty(this[errorName], 'name', { value: errorName })

    return this[errorName]
  }
}
