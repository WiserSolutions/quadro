describe('OrderCompleted', function() {
  it('returns 200 on success', async function() {
    await QT.onMessage('orders.completed', { orderId: 123 })
      .expectSuccess()
  })

  it('returns 200 on ignore', async function() {
    await QT.onMessage('orders.completed', { orderId: 'ignore_me' })
      .expectIgnore({ msg: 'nothing to do' })
  })

  describe('failures', function() {
    it('returns 500 on server failure', async function() {
      await QT.onMessage('orders.completed', { orderId: null })
        .expectFailure('No orderId')
    })

    it('sets body to provided object if not error', async function() {
      await QT.onMessage('orders.completed', { orderId: 'fail_with_object' })
        .expectFailure({ msg: 'failed with object' })
    })
  })

  describe('retries', function() {
    it('sends retry-after', async function() {
      await QT.onMessage('orders.completed', { orderId: 'retry' })
        .expectRetryAfterSec(60)
    })

    it('will retry', async function() {
      await QT.onMessage('orders.completed', { orderId: 'willRetry' },
        {attemptsMade: 1, maxAttempts: 5})
        .expectSuccess()
    })

    it('will not retry', async function() {
      await QT.onMessage('orders.completed', { orderId: 'willNotRetry' },
        {attemptsMade: 4, maxAttempts: 5})
        .expectSuccess()
    })
  })
})
