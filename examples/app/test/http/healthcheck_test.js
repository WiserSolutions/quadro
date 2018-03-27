describe('healthcheck', function() {
  let httpTest
  beforeEach(function() {
    httpTest = QT.httpTest.get('/alive')
  })

  it('has /healthcheck as the default endpoint', async function() {
    QT.stubConfig('quadro.http.healthcheck.endpoint', undefined)
    Q.container.run(require('../../../../routes/healthcheck'))
    await QT.httpTest.get('/healthcheck').expect(200)
  })

  it('responds to /alive', async function() {
    await QT.httpTest.get('/alive').expect(200)
  })

  describe('healthcheck dependency', function() {
    it('returns 200 if .check() returns true', async function() {
      const healthCheck = await Q.container.getAsync('healthcheck')
      this.sinon.stub(healthCheck, 'run').returns(true)

      await httpTest.expect(200)
    })

    it('returns 500 if .check() returns false', async function() {
      const healthCheck = await Q.container.getAsync('healthcheck')
      this.sinon.stub(healthCheck, 'run').returns(false)

      await httpTest.expect(500)
    })

    it('returns 500 and message if .check() throws', async function() {
      const healthCheck = await Q.container.getAsync('healthcheck')
      this.sinon.stub(healthCheck, 'run').throws(new Q.Errors.ValidationError('hello', { a: 1 }))

      const error = { message: 'hello', extra: { a: 1 } }
      await httpTest.expect(500, { error })
    })
  })
})
