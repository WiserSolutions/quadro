module.exports = class QError extends Error {
  /**
   * constructor - Constructs an error object
   *
   * @param  {String} message User readable error message
   * @param  {String} code    Error code
   * @param  {Object} data    Any supplementary data
   */
  constructor(message, code, data) {
    super(`${message} (${code})`)
    this.name = this.constructor.name
    this.code = code
    this.data = data
  }
}
