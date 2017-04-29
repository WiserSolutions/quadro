describe('routes', function() {
  describe('resources', function() {
    it('registers custom resource paths', async function() {
      await QT.httpTest
        .get('/admin_users/122')
        .expect(200, 'John 122')
    })
  })

  it('registers custom routes', async function() {
    await QT.httpTest
      .post('/hello')
      .expect(200, 'yep!')
  })
})
