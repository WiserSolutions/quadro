module.exports = function(container, httpServer) {
  let request = require('supertest')
  global.request = request

  before(function() {
    global.httpTest = request(httpServer)
    container.register('httpTest', httpTest)
  })
}
