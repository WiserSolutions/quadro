describe('Configuration API', function() {
  it('allows getting config value', async function() {
    QT.stubConfig('some.config.key', 123)
    await QT.httpTest
      .get('/config/some.config.key')
      .expect('Content-Type', /^application\/json/)
      .expect(200, { value: 123 })
  })

  it('allows setting config value', async function() {
    let provider = { set: this.sinon.spy() }
    await Q.config.registerConfigRoot('apiTest', provider)
    await QT.httpTest
      .put('/config/apiTest.test.key')
      .set('Content-Type', 'application/json')
      .send({ value: 234 })
      .expect(204)
    expect(provider.set).to.have.been.calledWith('test.key', 234)
  })
})
