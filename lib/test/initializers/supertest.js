global.request = require('supertest')

before(function() {
  global.httpTest = request(global.app.http)
})
