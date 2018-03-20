/* eslint no-unused-expressions: 0 */

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

    it('ignores local config in test mode', function() {
      expect(Q.config.get('yaml.nested.localKey')).to.be.undefined
    })
  })

  it('declares UnknownConfigProviderError', function() {
    expect(Q.Errors.UnknownConfigProviderError).to.be.ok
  })

  describe('set', function() {
    it('fails for file source', async function() {
      await expect(Q.config.set('some.key', 5)).to.be.eventually
        .rejectedWith(Q.Errors.UnknownConfigProviderError, 'Unknown configuration provider')
    })

    it('fails for read only provider', async function() {
      Q.config.registerConfigRoot('some', {
        get() {}
      })
      await expect(Q.config.set('some.key', 5)).to.be.eventually
        .rejectedWith(Q.Errors.ReadOnlyPropertyError, 'Unable to set')
    })

    it('calls config provider `set`', async function() {
      let provider = { set: this.sinon.spy() }
      Q.config.registerConfigRoot('some', provider)
      await Q.config.set('some.key', 5)
      expect(provider.set).to.be.calledWith('key', 5)
    })
  })

  describe('get', function() {
    it('returns default if config value does not exist', function() {
      expect(Q.config.get('missing.key', 5)).to.eql(5)
    })

    it('returns nested values', function() {
      expect(Q.config.get('yaml.nested.nested1.key')).to.eql('nestedValue')
    })

    it('env variable overrides value', function() {
      process.env.YAML_NESTED_NESTED_1_KEY = 'ValueFromEnv'
      expect(Q.config.get('yaml.nested.nested1.key')).to.eql('ValueFromEnv')
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
      it('supports .get function', async function() {
        let provider = { get: this.sinon.spy() }
        Q.config.registerConfigRoot('currencies', provider)
        Q.config.get('currencies.uk')
        expect(provider.get).to.have.been.calledWith('uk')
      })

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

  describe('Mongo config provider', function() {
    const COLLECTION = 'locations_config'
    let provider, collection
    beforeEach(async function() {
      provider = await Q.container.getAsync('config:mongoConfigProvider')
      Q.config.registerConfigRoot('locations', await provider(COLLECTION))

      collection = await Q.container.getAsync('mongo').then(mongo => mongo.collection(COLLECTION))

      await collection.drop()
    })

    it('can write only objects', async function() {
      await expect(Q.config.set('locations.ru', 123.4))
        .to.be.rejectedWith(
          Q.Errors.InvalidOperationError,
          /Mongo config provider does not support atomic values at root level/
        )
    })

    it('sets config value', async function() {
      await Q.config.set('locations.ru.lat', 0.5)
      const doc = await collection.findOne({ id: 'ru' })
      expect(doc).to.be.ok
      expect(doc.lat).to.equal(0.5)
    })

    it('returns undefined if config document does not exist', function() {
      return expect(Q.config.get('locations.uk')).to.become(undefined)
    })

    it('returns default value if document does not exist', function() {
      return expect(Q.config.get('locations.uk', 'hello')).to.become('hello')
    })

    it('can read a sub-document', async function() {
      await collection.insertOne({ id: 'hello', foo: { a: 1 } })
      expect(await Q.config.get('locations.hello.foo')).to.eql({ a: 1 })
    })

    it('can read the whole document', async function() {
      await collection.insertOne({ id: 'hello', foo: { a: 1 }})
      expect(await Q.config.get('locations.hello')).to.eql({ foo: { a: 1 } })
    })
  })

  describe('DynamoDBConfigProvider', function() {
    this.timeout(5000)

    let provider
    beforeEach(async function() {
      provider = await Q.container.getAsync('config:dynamodbConfigProvider')
      Q.config.registerConfigRoot('currencies', await provider('dynamodb-config-provider-test'))
    })

    it('can write value', async function() {
      await Q.config.set('currencies.usd', 123)
      expect(await Q.config.get('currencies.usd')).to.equal('123')
    })
  })

  describe('caching', function() {
    const provider = { get(s) { return s.toUpperCase() } }
    beforeEach(async function() {
      let cache = await Q.container.getAsync('cache')
      await cache.clear()
      await Q.config.registerConfigRoot('currencies', provider, {
        cache: { ttl: 30 }
      })
    })

    it('caches config value', async function() {
      this.sinon.spy(provider, 'get')
      await Q.config.get('currencies.cache_test')
      await Q.config.get('currencies.cache_test')
      expect(provider.get).to.have.been.calledOnce
    })
  })
})
