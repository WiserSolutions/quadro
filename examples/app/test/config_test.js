describe('config', function() {
  it('loads distinct configs', function() {
    expect(config.yaml.key).to.eql('devValue')
  })

  describe('config merge', function() {
    it('defaults to /config/*.js', function() {
      expect(config.get('yaml.nested.nested1.envSpecificKey')).to.eql('devValue')
    })

    it('deep merges configs', function() {
      expect(config.get('yaml.nested.globalKey')).to.eql('globalVal')
    })
  })

  describe('get', function() {
    it('returns default if config value does not exist', function() {
      expect(config.get('missing.key', 5)).to.eql(5)
    })

    it('returns nested values', function() {
      expect(config.get('yaml.nested.nested1.key')).to.eql('nestedValue')
    })
  })
})
