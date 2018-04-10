QT.stubConfig = function(stubPath, value) {
  let original = Q.config.get
  if (!isAlreadyStubbed(Q.config.get)) {
    let map = {}
    map[stubPath] = value
    QT.currentTest.sinon.stub(Q.config, 'get').callsFake(function(path, defaultValue) {
      if (map.hasOwnProperty(path)) {
        let value = map[path]
        return value === undefined ? defaultValue : map[path]
      }
      return original.bind(Q.config)(path, defaultValue)
    })
    Q.config.get.configStubsMap = map
  } else {
    Q.config.get.configStubsMap[stubPath] = value
  }
}

QT.restoreConfig = function(path) {
  let get = Q.config.get
  if (!get.configStubsMap) return
  delete get.configStubsMap[path]
}

function isAlreadyStubbed(method) {
  return method.restore && method.restore.sinon
}
