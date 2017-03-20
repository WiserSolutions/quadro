describe('UsersController', function() {
  describe('show', function() {
    it('responds', async function() {
      await httpTest
        .get('/users/1')
        .expect(200, 'John 1')
    })
  })
})
