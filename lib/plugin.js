const path = require('path')

module.exports = class {
  constructor(moduleName) {
    if (moduleName.startsWith('.')) {
      moduleName = path.join(Q.app.appDir, moduleName)
    }
    this.modulePath = require.resolve(moduleName)
    this.module = require(moduleName)
    this.pluginDir = path.dirname(this.modulePath)
    this.name = path.basename(this.pluginDir)
  }
}
