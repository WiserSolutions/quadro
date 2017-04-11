describe('routes', function() {
  it('registers custom routes', async function() {
    await QT.httpTest
      .post('/hello')
      .expect(200, 'yep!')
  })
})
