const { inherits } = require('util')

module.exports = class {
  constructor() {
    this.declareError('ReadOnlyPropertyError', function(property) {
      this.message = `Unable to set read-only property '${property}'`
    })

    this.declareError('ValidationError', function(message) {
      this.message = message
    })

    this.declareError('InvalidArgumentError', 'Invalid argument')
    this.declareError('InvalidOperation')
    this.declareError('NotImplementedError', function(method) {
      this.message = `'${method}' is not implemented`
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
      this.extra = extra || {}
      if (initializer) initializer.apply(this, [message, extra])
    }
    inherits(this[errorName], Error)
    this[errorName].prototype.name = errorName

    return this[errorName]
  }
}
