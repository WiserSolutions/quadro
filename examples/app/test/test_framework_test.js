describe('Test framework', function() {
  describe('sinon', function() {
    it('supports sinon', function() {
      this.sinon.stub(Date, 'now').callsFake(_ => 123)
      expect(Date.now()).to.eql(123)
    })

    describe('custom matches', function() {
      it('supports containSubset', function() {
        let spy = this.sinon.spy()
        spy({ a: 1, b: 2 })
        expect(spy).to.be.calledWith(this.sinon.match.containSubset({ a: 1 }))
        expect(spy).to.not.be.calledWith(this.sinon.match.containSubset({ c: 3 }))
      })
    })
  })

  describe('BDD', function() {
    def('string', 'hello')
    def('processed', () => get.string.toUpperCase())

    context('inner context', function() {
      def('string', 'hi')

      it('behaves like RSpec', function() {
        expect(get.processed).to.eql('HI')
      })
    })
  })
})
