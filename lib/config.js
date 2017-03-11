const path = require('path')
const glob = Promise.promisify(require('glob'))
const _ = require('lodash')
const fs = require('mz/fs')
const dot = require('dot-object')

const EXTENSION_PATTERN = '@(yml|js|yaml|json)'

module.exports = class {
  constructor(app) {
    this.__app = app

    this.configDirs = [
      path.join(app.quadroDir, 'config'),
      path.join(app.appDir, 'config'),
      path.join(app.appDir, `config/${app.env}`),
      path.join(app.appDir, 'config/local')
    ]
  }

  get(key, defaultValue) {
    return dot.pick(key, this) || defaultValue
  }

  async initialize() {
    let names = await this.getDistinctConfigNames()
    await this.loadConfigs(names)
  }

  async getDistinctConfigNames() {
    let configFiles = await Promise.map(this.configDirs,
      async _ => await glob(`${_}/*.${EXTENSION_PATTERN}`)
    )

    return _(configFiles).flatten()
      .map(_ => path.basename(_, path.extname(_)))
      .uniq().value()
  }

  async loadConfigs(names) {
    return await Promise.map(names, async name => await this.loadConfig(name))
  }

  async loadConfig(name) {
    let files = _.flatten(await Promise.all(
      this.configDirs
        .map(_ => `${_}/${name}.${EXTENSION_PATTERN}`)
        .map(async path => await glob(path))
    ))
    let configs = await Promise.all(files.map(async file => await this.parseConfig(file)))

    this[name] = _.merge(...configs)
  }

  async parseConfig(file) {
    let ext = path.extname(file)
    if (ext === '.json' || ext === '.js') return require(file)
    if (ext === '.yaml' || ext === '.yml') {
      let yaml = require('js-yaml')
      return await yaml.safeLoad(await fs.readFile(file))
    }

    console.log(`Warning: don't know how to parse file ${file}. Ignoring...`)
    return {}
  }
}
