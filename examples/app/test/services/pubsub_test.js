describe('pubsub', function() {
  describe('publish', function() {
    it('publishes a message', function(done) {
      QT.stubConfig('quadro.pubsub.endpoint', 'https://test-hub.com:3455')
      let headers = { 'Content-Type': 'application/json' }
      nock('https://test-hub.com:3455', headers)
        .post('/api/v1/messages', {
          messageType: 'done',
          content: {
            hello: 'world'
          }
        })
        .reply(200, () => done())
      pubsub.publish('done', { hello: 'world' }, 'http')
    })
  })
})
