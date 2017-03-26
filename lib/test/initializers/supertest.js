module.exports = function(container, httpServer) {
  let request = require('supertest')
  QT.request = request

  before(function() {
    QT.httpTest = request(httpServer)
    container.register('httpTest', QT.httpTest)
  })
}
