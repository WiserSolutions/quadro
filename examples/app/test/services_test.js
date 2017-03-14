describe('Services', function() {
  describe('Loading', function() {
    it('is being load on startup', function() {
      let services = container.find(/^services:/)
      expect(services.length).to.be.gt(0)
    })

    it('registers services by name', function() {
      expect(container.find('services:')).to.include('services:test_svc')
    })

    it('registers services as classes', function() {
      let svc = container.get('services:test_svc')
      expect(typeof svc.increment).to.eql('function')
    })

    it('registers services as singletons', function() {
      container.get('services:test_svc').increment()
      expect(container.get('services:test_svc').counter).to.eql(1)
    })
  })
})
