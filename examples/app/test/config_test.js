describe('config', function() {
  it('loads distinct configs', function() {
    expect(Q.config.yaml.key).to.eql('devValue')
  })

  describe('config merge', function() {
    it('defaults to /config/*.js', function() {
      expect(Q.config.get('yaml.nested.nested1.envSpecificKey')).to.eql('devValue')
    })

    it('deep merges configs', function() {
      expect(Q.config.get('yaml.nested.globalKey')).to.eql('globalVal')
    })
  })

  describe('get', function() {
    it('returns default if config value does not exist', function() {
      expect(Q.config.get('missing.key', 5)).to.eql(5)
    })

    it('returns nested values', function() {
      expect(Q.config.get('yaml.nested.nested1.key')).to.eql('nestedValue')
    })
  })

  describe('tests', function() {
    describe('stubConfig', function() {
      it('stubs value', function() {
        QT.stubConfig('quadro.logger.hello', 123)
        expect(Q.config.get('quadro.logger.hello')).to.equal(123)
      })

      it('does not override other config values', function() {
        let level = Q.config.get('quadro.logger.level')
        expect(level).to.not.eql(null)
        QT.stubConfig('quadro.logger.hello', 123)
        expect(Q.config.get('quadro.logger.level')).to.equal(level)
      })
    })
  })
})
