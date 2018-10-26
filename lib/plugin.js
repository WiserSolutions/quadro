const path = require('path')

module.exports = class Plugin {
  constructor(moduleName) {
    if (moduleName.startsWith('.')) {
      moduleName = path.join(Q.app.appDir, moduleName)
    }

    this.modulePath = require.resolve(moduleName, { paths: [ Q.app.appDir ] })
    this.module = require(this.modulePath)
    this.pluginDir = path.dirname(this.modulePath)
    this.name = path.basename(this.pluginDir)
  }

  static loadSinglePlugin(plugin) {
    let { name: moduleName, condition } = typeof plugin === 'string' ? { name: plugin } : plugin
    if (condition && !condition()) return null

    return new Plugin(moduleName)
  }

  static loadList(plugins) {
    return (plugins || [])
      .map(p => this.loadSinglePlugin(p))
      .filter(Boolean)
  }
}
