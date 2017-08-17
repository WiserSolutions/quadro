module.exports = class HubMessageContext {
  constructor(message) {
    this.message = message
  }

  success(message, code) {
    this.success = true
    this.statusCode = code
  }

  failure(err, code) {
    if (err) {
      if (err instanceof Error) {
        this.err = err.message
      } else {
        this.err = err
      }
    }
    this.statusCode = code
    this.failed = true
  }

  retryAfterSec(seconds, message, code) {
    this.retryAfterSec = seconds || 60
    this.statusCode = code
  }

  getMessage() {
    return this.message
  }

  getStatusCode() {
    return this.statusCode
  }

  getError() {
    return this.err
  }

  getRetrySec() {
    return this.retryAfterSec || 60
  }

  isSuccess() {
    return this.success | false
  }

  isFailed() {
    return this.failed | false
  }
}
