/* eslint no-unused-expressions: 0 */

describe('Errors', function() {
  describe('declareError', function() {
    it('creates new error', function() {
      Q.Errors.declareError('SomeError')
      expect(Q.Errors.SomeError).to.be.ok
    })

    it('supports initializer', function() {
      Q.Errors.declareError('SomeError', function() {
        this.foo = 'bar'
      })
      expect(new Q.Errors.SomeError().foo).to.equal('bar')
    })

    it('allows default message', function() {
      Q.Errors.declareError('SomeError', 'hello')
      expect(new Q.Errors.SomeError().message).to.eql('hello')
    })
  })

  describe('created errors', function() {
    it('accepts message', function() {
      Q.Errors.declareError('SomeError')
      expect(new Q.Errors.SomeError('hello').message).to.equal('hello')
    })

    it('accepts extra data', function() {
      Q.Errors.declareError('SomeError')
      expect(new Q.Errors.SomeError('hello', {a: 123}).extra).to.eql({a: 123})
    })

    it('can accept extra as single argument', function() {
      Q.Errors.declareError('SomeError')
      expect(new Q.Errors.SomeError({ a: 123 }).extra).to.eql({ a: 123 })
    })

    it('is instanceof Error', function() {
      Q.Errors.declareError('SomeError')
      expect(new Q.Errors.SomeError()).to.be.instanceof(Error)
    })
  })
})
