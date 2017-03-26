describe('OrderCompleted', function() {
  it('returns 200 on success', async function() {
    await QT.onMessage('orders.completed', { orderId: 123 })
      .expectSuccess()
  })

  describe('failures', function() {
    it('returns 500 on server failure', async function() {
      await QT.onMessage('orders.completed', { orderId: null })
        .expectFailure('No orderId')
    })
  })

  describe('retries', function() {
    it('sends retry-after', async function() {
      await QT.onMessage('orders.completed', { orderId: 'retry' })
        .expectRetryAfterSec(60)
    })
  })
})
