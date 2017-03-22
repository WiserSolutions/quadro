describe('Redis Service', function() {
  it('exists', async function() {
    let redis = Q.container.get('redis')
    expect(await redis.pingAsync('hello')).to.eql('hello')
  })
})
