describe('Services', function() {
  describe('Loading', function() {
    it('is resolved by service name', function() {
      expect(Q.container.get('testSvc')).to.not.eql(null)
    })

    it('supports module @aliases property', function() {
      expect(Q.container.get('my-alias')).to.be.equal(Q.container.get('testSvc'))
    })

    it('is being load on startup', function() {
      let services = Q.container.find(/^services:/)
      expect(services.length).to.be.gt(0)
    })

    it('registers services by name', function() {
      expect(Q.container.find('services:')).to.include('services:testSvc')
    })

    it('registers services as classes', function() {
      let svc = Q.container.get('services:testSvc')
      expect(typeof svc.increment).to.eql('function')
    })

    it('registers services as singletons', function() {
      Q.container.get('services:testSvc').increment()
      expect(Q.container.get('services:testSvc').counter).to.eql(1)
    })

    describe('Nested', function() {
      it('registers nested:svc', function() {
        let svc = Q.container.get('nested:svc')
        expect(svc.foo).to.eql('bar')
      })
    })
  })
})
