describe('pubsub', function() {
  describe('publish', function() {
    it('publishes a message', function(done) {
      let headers = { 'Content-Type': 'application/json' }
      nock('http://hub:8080', headers)
        .post('/api/v1/messages', {
          messageType: 'done',
          content: {
            hello: 'world'
          }
        })
        .reply(200, () => done())
      pubsub.publish('done', { hello: 'world' })
    })
  })
})
