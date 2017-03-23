QT.stubConfig = function(stubPath, value) {
  let original = Q.config.get
  if (!isAlreadyStubbed(Q.config.get)) {
    let map = {}
    map[stubPath] = value
    QT.currentTest.sinon.stub(Q.config, 'get').callsFake(function(path) {
      if (map.hasOwnProperty(path)) return map[path]
      return original.bind(Q.config)(path)
    })
    Q.config.get.configStubsMap = map
  } else {
    Q.config.get.configStubsMap[stubPath] = value
  }
}

function isAlreadyStubbed(method) {
  return method.restore && method.restore.sinon
}
