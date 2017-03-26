const request = require('supertest')
const Test = request.Test

Test.prototype.expectSuccess = function() {
  return this.expect(200)
}

Test.prototype.expectRetryAfterSec = function(seconds) {
  return this.expect(307)
    .expect('retry-after', seconds.toString())
}

/**
 * Test.prototype.expectFailure - Asserts handler returns a failure
 *
 * @param  {Number} status  HTTP status code
 * @param  {String} message Error message
 */
Test.prototype.expectFailure = function(status, message) {
  if (arguments.length > 1) return this.expect(status, message)
  return this.expect(status)
}

QT.onMessage = function(type, message) {
  let envelope = { type, content: message }
  return QT.httpTest
    .post(`/handlers/${type}`)
    .send(envelope)
}
