QT.stubConfig = function(stubPath, value) {
  let original = Q.config.get
  QT.currentTest.sinon.stub(Q.config, 'get', function(path) {
    if (path === stubPath) return value
    return original.bind(Q.config)(path)
  })
}
