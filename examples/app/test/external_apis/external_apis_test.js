describe('External APIs', function() {
  const JSON_CONTENT = { 'content-type': 'application/json' }
  const LOCAL_SERVER = 'localhost:3000'

  describe('Registry', function() {
    it('Registers APIs', async function() {
      const myAPI = Q.externalAPI.register('myAPI', { host: 'example.com' })

      expect(myAPI).to.equal(Q.externalAPI.myAPI)
      expect(myAPI.constructor.name).to.eql('APIWrapper')
    })
  })

  describe('APIs', function() {
    let api
    beforeEach(function() {
      api = Q.externalAPI.register('httpVerbsTestAPI', { host: 'apihost.com' })
    })

    it('supports arbitrary requests', async function() {
      nock('http://apihost.com')
        .options('/hello')
        .reply(201, { method: 'options' }, JSON_CONTENT)
      expect(await api.request('/hello', { method: 'options' }))
        .to.eql({ method: 'options' })
    })

    describe('HTTP verbs', function() {
      it('supports GET', async function() {
        nock('http://apihost.com')
          .get('/users?param=get')
          .reply(201, { method: 'get' }, JSON_CONTENT)
        expect(await api.get('/users', { param: 'get' })).to.eql({ method: 'get' })
      })

      it('supports POST', async function() {
        nock('http://apihost.com')
          .post('/users', { body: 'post' })
          .reply(201, { method: 'post' }, JSON_CONTENT)
        expect(await api.post('/users', { body: 'post' })).to.eql({ method: 'post' })
      })

      it('supports PUT', async function() {
        nock('http://apihost.com')
          .put('/users', { body: 'put' })
          .reply(201, { method: 'put' }, JSON_CONTENT)
        expect(await api.put('/users', { body: 'put' })).to.eql({ method: 'put' })
      })

      it('supports DELETE', async function() {
        nock('http://apihost.com').delete('/users')
          .reply(201, { method: 'delete' }, JSON_CONTENT)
        expect(await api.delete('/users')).to.eql({ method: 'delete' })
      })
    })

    describe('errors', function() {
      it('throws APIRequestError if server replies 4xx', async function() {
        nock('http://apihost.com').get('/users').reply(401, {})
        await expect(api.get('/users')).to.be.rejectedWith(Q.Errors.APIRequestError)
      })

      it('throws APIRequestError if server replies 5xx', async function() {
        nock('http://apihost.com').get('/users').reply(503, {})
        await expect(api.get('/users')).to.be.rejectedWith(Q.Errors.APIRequestError)
      })
    })

    describe('timeout', function() {
      let router
      beforeEach(async function() {
        router = await Q.container.get('router')
      })

      it('sets timeout correctly', async function() {
        const api = Q.externalAPI.register('myAPI', {
          host: LOCAL_SERVER,
          timeout: 50
        })
        router.get('/delayed', (ctx) => Promise.delay(100).then(() => ctx.status = 200))
        await expect(api.get('/delayed')).to.be
          .rejectedWith(Q.Errors.APIRequestError, /failure: ESOCKETTIMEDOUT/)
      })
    })

    describe('retries', function() {
      describe('fibonacci', function() {
        it('retries according to fib schedule', async function() {
          const api = Q.externalAPI.register('myAPI', {
            host: 'failing.com',
            retry: { times: 5, startInterval: 100, strategy: 'fibonacci' }
          })
          expect()
        })
      })
    })
  })
})
