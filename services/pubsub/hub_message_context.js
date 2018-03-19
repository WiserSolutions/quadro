const DEFAULT_MAX_ATTEMPTS = 5
const DEFAULT_ATTEMPTS_MADE = 0
module.exports = class HubMessageContext {
  constructor(message) {
    this.rawMessage = message
    this.message = message.content
  }

  ignore(message) {
    return this.success(message)
  }

  success(message, code) {
    this.success = true
    this.statusCode = code || 200
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
    this._retryAfterSec = seconds || 60
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

  getRetryAfterSec() {
    return this._retryAfterSec || 60
  }

  isSuccess() {
    return this.success || false
  }

  shouldRedeliver() {
    return !!this._retryAfterSec
  }

  isFailed() {
    return this.failed || false
  }

  willRetry() {
    let maximumAttempts = parseInt(this.rawMessage.maxAttempts) || DEFAULT_MAX_ATTEMPTS
    let attemptsMadeTillNow = parseInt(this.rawMessage.attemptsMade) || DEFAULT_ATTEMPTS_MADE
    return attemptsMadeTillNow + 1 < maximumAttempts
  }
}
