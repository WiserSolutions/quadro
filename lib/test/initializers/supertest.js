module.exports = function(container, httpServer) {
  global.request = require('supertest')

  before(function() {
    global.httpTest = request(httpServer)
    container.register('httpTest', httpTest)
  })
}
