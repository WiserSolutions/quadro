describe('messageProcessor', function() {
  let processor

  beforeEach(async function() {
    processor = await Q.container.getAsync('pubsub:hubMessageProcessor')
  })

  it('registers messages in messageProcessor', async function() {
    expect(processor.handlers['orders.completed']).to.be.ok
  })
})
