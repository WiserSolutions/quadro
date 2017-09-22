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

  describe('nested errors', function() {
    const NestedError = Q.Errors.declareError('NestedError')
    const TopLevelError = Q.Errors.declareError('TopLevelError', 'Default message')

    it('sets nestedError attribute', function() {
      let err = new TopLevelError('something happened', new NestedError('because of this'))
      expect(err.message).to.equal('something happened')
      expect(err.nestedError).to.be.an.instanceof(Q.Errors.NestedError)
    })

    it('supports nested error as only argument', function() {
      let err = new TopLevelError(new NestedError('because of this'))
      expect(err.message).to.equal('Default message')
      expect(err.nestedError).to.be.an.instanceof(Q.Errors.NestedError)
      expect(err.extra).to.eql({})
    })

    it('supports message, extra and nested errors', function() {
      let err = new TopLevelError('something happened', {a: 1}, new NestedError('because of this'))
      expect(err.message).to.equal('something happened')
      expect(err.nestedError).to.be.an.instanceof(Q.Errors.NestedError)
      expect(err.extra).to.eql({a: 1})
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
