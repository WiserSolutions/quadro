describe('/version', function() {
  let retreiver

  beforeEach(async () => retreiver = await Q.container.getAsync('versionRetreiver'))

  it('returns versionRetreiver.getVerion response', async function() {
    this.sinon.stub(retreiver, 'getVersion').callsFake(() => 'hello')
    await QT.httpTest
      .get('/_version')
      .expect('Content-Type', 'text/plain; charset=utf-8')
      .expect(200, 'hello')
  })

  it('returns versionRetreiver.getVerion response', async function() {
    this.sinon.stub(retreiver, 'getVersion').callsFake(() => ({ hello: 'world' }))
    await QT.httpTest
      .get('/_version')
      .expect('Content-Type', 'application/json; charset=utf-8')
      .expect(200, { hello: 'world' })
  })

  it('returns 500 response on error', async function() {
    this.sinon.stub(retreiver, 'getVersion').callsFake(() => { throw Error('hello') })

    await QT.httpTest
      .get('/_version')
      .expect(500)
  })
})
