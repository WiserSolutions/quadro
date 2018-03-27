describe('Health-Check', function() {
  it('run', async function() {
    const healthCheck = await Q.container.getAsync('healthcheck')

    expect(await healthCheck.run()).to.eql(true)
  })
})
