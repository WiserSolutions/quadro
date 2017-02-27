const path = require('path')
const bluebird = require('bluebird')
const glob = bluebird.promisify(require('glob'))
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
    let configFiles = await Promise.all(
      this.configDirs.map(async _ => await glob(`${_}/*.${EXTENSION_PATTERN}`))
    )

    let configNames = _.flatten(configFiles)
      .map(_ => path.basename(_, path.extname(_)))

    return _.uniq(configNames)
  }

  async loadConfigs(names) {
    let configPromises = names.map(async name => {
      let configs = await this.loadConfig(name)
    })
    await Promise.all(configPromises)
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
