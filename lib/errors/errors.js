const QuadroError = require('./quadro_error')
const { inherits } = require('util')

class Errors {
  constructor() {
    this.QuadroError = QuadroError

    this.declare('ReadOnlyPropertyError', 'Unable to set read-only property')
    this.declare('ValidationError', 'Error validating request/data')

    this.declare('InvalidArgumentError', 'Invalid argument')
    this.declare('InvalidOperation', 'Invalid operation')
    this.declare('NotImplementedError', 'Operation not implemented')
  }

  // Adds the required behavior to a custom error constructor
  // so that it will be recognized as an error by all the frameworks
  _makeItAnError(errorClass, baseClass, errorName) {
    inherits(errorClass, baseClass)
    errorClass.prototype.name = errorName
    Object.defineProperty(errorClass, 'name', { value: errorName })

    this[errorName] = errorClass

    return errorClass
  }

  declare(errorName, ...defaultArgs) {
    const Err = function(...args) {
      QuadroError.call(this, ...args)

      this.name = errorName
    }

    let baseClass = QuadroError
    for (var arg of defaultArgs) {
      if (!arg) continue
      if (typeof arg === 'object') {
        Err.prototype._defaultExtra = arg
      } else if (typeof arg === 'string') {
        Err.prototype._defaultMessage = arg
      } else if (arg.prototype instanceof QuadroError) {
        baseClass = arg
      }
    }

    return this._makeItAnError(Err, baseClass, errorName)
  }
}

module.exports = Errors
