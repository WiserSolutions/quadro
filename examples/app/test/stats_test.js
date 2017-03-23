describe('stats', function() {
  it('is a valid object', async function() {
    let statsd = Q.container.get('stats')
    expect(typeof statsd.increment).to.eql('function')
    expect(typeof statsd.gauge).to.eql('function')
    expect(typeof statsd.timing).to.eql('function')
  })
})
