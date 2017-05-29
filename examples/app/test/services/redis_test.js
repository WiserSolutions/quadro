describe('Redis Service', function() {
  it('exists', async function() {
    let redis = await Q.container.getAsync('redis')
    expect(await redis.pingAsync('hello')).to.eql('hello')
  })
})
