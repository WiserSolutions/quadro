describe('config', function() {
  it('loads distinct configs', function() {
    expect(Q.config.yaml.key).to.eql('testValue')
  })

  describe('config merge', function() {
    it('defaults to /config/*.js', function() {
      expect(Q.config.get('yaml.nested.nested1.envSpecificKey')).to.eql('testValue')
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
      it('returns default if stubbed value is undefined', function() {
        QT.stubConfig('quadro.logger.hello', undefined)
        expect(Q.config.get('quadro.logger.hello', 123)).to.eql(123)
      })

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

      it('allows to stub more than 1 value', function() {
        QT.stubConfig('quadro.hello1', 123)
        QT.stubConfig('quadro.hello2', 246)
        expect(Q.config.get('quadro.hello1')).to.eql(123)
        expect(Q.config.get('quadro.hello2')).to.eql(246)
      })
    })
  })

  describe('providers', function() {
    describe('registerConfigRoot', async function() {
      it('adds config namespace', function() {
        Q.config.registerConfigRoot('currencies', (key) => key.toUpperCase())
        expect(Q.config.get('currencies.uk')).to.eql('UK')
      })

      it('supports async providers', async function() {
        let provider = async (key) => Promise.delay(25).then(() => key.toLowerCase())
        Q.config.registerConfigRoot('currencies', provider)
        expect(await Q.config.get('currencies.UK')).to.eql('uk')
      })

      it('returns default if async provider fails', async function() {
        let provider = async (key) => Promise.delay(25).then(function() { throw new Error() })
        Q.config.registerConfigRoot('currencies', provider)
        expect(await Q.config.get('currencies.UK', '$')).to.eql('$')
      })
    })
  })
})
