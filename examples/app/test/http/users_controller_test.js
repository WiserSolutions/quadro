describe('UsersController', function() {
  describe('show', function() {
    it('responds', async function() {
      await QT.httpTest
        .get('/users/1')
        .expect(200, 'John 1')
    })
  })

  describe('create', function() {
    it.only('uploads a file', async function() {
      await QT.httpTest
        .post('/users')
        .attach('file', `${Q.app.appDir}/test/fixtures/upload_test_file.txt`)
        .expect(201, 'content of test file\n')
    })
  })
})
