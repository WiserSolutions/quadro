describe('Health-Check', function() {
  it('returns true when connection is healthy', async function() {
    const healthCheck = await Q.container.getAsync('healthcheck')

    expect(await healthCheck.run()).to.eql(true)
  })

  it('returns true if mongo endpoint is not provided', async function() {
    QT.stubConfig('db.endpoint', undefined)
    const healthCheck = await Q.container.getAsync('healthcheck')

    expect(await healthCheck.run()).to.eql(true)
  })
})
