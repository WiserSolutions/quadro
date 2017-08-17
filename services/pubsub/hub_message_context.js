module.exports = class HubMessageContext {
  constructor(message) {
    this.rawMessage = message
    this.message = message.content
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

  getRawMessage() {
    return this.rawMessage
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
