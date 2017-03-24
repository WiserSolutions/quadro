describe('Services', function() {
  describe('Loading', function() {
    it('is resolved by service name', function() {
      expect(Q.container.get('test_svc')).to.not.eql(null)
    })

    it('is being load on startup', function() {
      let services = Q.container.find(/^services:/)
      expect(services.length).to.be.gt(0)
    })

    it('registers services by name', function() {
      expect(Q.container.find('services:')).to.include('services:test_svc')
    })

    it('registers services as classes', function() {
      let svc = Q.container.get('services:test_svc')
      expect(typeof svc.increment).to.eql('function')
    })

    it('registers services as singletons', function() {
      Q.container.get('services:test_svc').increment()
      expect(Q.container.get('services:test_svc').counter).to.eql(1)
    })
  })
})
