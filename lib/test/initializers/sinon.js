const sinon = require('sinon')

beforeEach(function() {
  this.sinon = sinon.sandbox.create()
})

afterEach(function() {
  this.sinon.restore()
})

sinon.match.containSubset = function(obj) {
  return sinon.match(function(value) {
    try {
      expect(value).to.containSubset(obj)
    } catch (err) {
      return false
    }
    return true
  }, `contains ${JSON.stringify(obj)}`)
}
