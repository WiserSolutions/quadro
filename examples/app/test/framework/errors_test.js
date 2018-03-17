/* eslint no-unused-expressions: 0 */

describe('Errors', function() {
  describe('QuadroError', function() {
    it('is an Error', function() {
      expect(new Q.Errors.QuadroError()).to.be.instanceOf(Error)
    })
  })

  describe('declare', function() {
    it('registers an error', function() {
      const Err = Q.Errors.declare('SomeUniqueError')
      const err = new Err()
      expect(err).to.be.instanceOf(Q.Errors.QuadroError)
      expect(Err).to.equal(Q.Errors.SomeUniqueError)
    })

    describe('message', function() {
      it('creates a default message', function() {
        const Err = Q.Errors.declare('SomeError', 'default message')
        return expect(Promise.reject(new Err()))
          .to.be.rejectedWith(Err, 'default message')
      })

      it('can override message', function() {
        const Err = Q.Errors.declare('SomeError', 'default message')
        return expect(Promise.reject(new Err('overridden message')))
          .to.be.rejectedWith(Err, 'overridden message')
      })
    })

    describe('nestedError', function() {
      it('allows to specify a nested exception', function() {
        const Err = Q.Errors.declare('SomeError')
        const nested = new Error('nested error')
        const err = new Err().withNested(nested)
        expect(err.nestedError).to.equal(nested)
      })
    })

    describe('extraData', function() {
      it('allows to specify default extra data', function() {
        const Err = Q.Errors.declare('SomeError', { a: 1 })
        const err = new Err()
        expect(err.extra).to.eql({ a: 1 })
      })

      it('allows to append/override extra data', function() {
        const Err = Q.Errors.declare('SomeError', { a: 1, b: 2 })
        const err = new Err().withExtra({ b: 3, d: 4 })
        expect(err.extra).to.eql({ a: 1, b: 3, d: 4 })
      })

      it('allows specify extra data in error instance', function() {
        const Err = Q.Errors.declare('SomeError')
        const err = new Err('hello', { a: 1 })
        expect(err.extra).to.eql({ a: 1 })
      })
    })

    describe('base class', function() {
      it('allows to specify a base class', function() {
        const Err = Q.Errors.declare('SomeError', { a: 1 }, Q.Errors.ValidationError)
        return expect(Promise.reject(new Err()))
          .to.be.rejectedWith(Q.Errors.ValidationError)
      })
    })

    describe('usage', function() {
      it('throws with chain', function() {
        const Err = Q.Errors.declare('SomeError', 'hello')
        try {
          throw new Err('hi').withExtra({ z: -1 })
        } catch (err) {
          expect(err.extra).to.eql({ z: -1 })
        }
      })
    })
  })
})
