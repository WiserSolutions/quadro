const path = require('path')
const _ = require('lodash')
const fs = require('mz/fs')
const dot = require('dot-object')

const EXTENSION_PATTERN = '@(yml|js|yaml|json)'

const UnknownConfigProviderError = Q.Errors.declareError('UnknownConfigProviderError', function(providerName, key) {
  if (providerName) {
    this.message = `Unknown configuration provider '${providerName}' for key '${key}'`
  } else {
    this.message = `Configuration provider not specified for key '${key}'`
  }
})

module.exports = class {
  constructor(app) {
    this.__app = app

    this.configDirs = [
      path.join(app.quadroDir, 'config'),
      path.join(app.appDir, 'config'),
      path.join(app.appDir, `config/${app.env}`)
    ]
    if (app.env !== 'test') {
      this.configDirs.push(path.join(app.appDir, 'config/local'))
    }

    this.namespaceProviders = {}
  }

  parsePath(path) {
    let dotIndex = path.indexOf('.')
    if (dotIndex === -1) return { namespace: null, key: path }
    return { namespace: path.substring(0, dotIndex), key: path.substring(dotIndex + 1) }
  }

  async set(path, value) {
    let {namespace, key} = this.parsePath(path)
    if (!namespace) throw new Q.Errors.BadRequest('Can not set config key for unknown provider: ' + path)

    let provider = this.namespaceProviders[namespace]
    if (!provider) throw new UnknownConfigProviderError(namespace, key)
    if (!provider.set) throw new Q.Errors.ReadOnlyPropertyError(path)

    return await provider.set(key, value)
  }

  get(key, defaultValue) {
    let value = dot.pick(key, this)
    if (value !== undefined) return value

    let namespace = key.replace(/\..*$/, '')  // Strip key after first dot
    let provider = this.namespaceProviders[namespace]
    if (provider) {
      let getter = typeof provider.get === 'function' ? provider.get : provider
      let value = getter(key.replace(/^.*?\./, ''))  // Get string before dot
      if (value && typeof value.then === 'function') {
        return value.catch(function(err) {
          Q.log.error({ err, namespace, key }, 'Configuration provider error')
          return defaultValue
        })
      } else return value
    }
    return defaultValue
  }

  registerConfigRoot(namespace, provider) {
    this.namespaceProviders[namespace] = provider
  }

  async initialize() {
    let names = await this.getDistinctConfigNames()
    await this.loadConfigs(names)
  }

  async getDistinctConfigNames() {
    let configFiles = await this.__app.glob(`*.${EXTENSION_PATTERN}`, {
      dirs: this.configDirs
    })

    return _.map(configFiles, _ => path.basename(_, path.extname(_)))
  }

  async loadConfigs(names) {
    return await Promise.map(names, async name => await this.loadConfig(name))
  }

  async loadConfig(name) {
    let files = await this.__app.glob(`${name}.${EXTENSION_PATTERN}`, {
      dirs: this.configDirs
    })
    let configs = await Promise.map(files, async file => await this.parseConfig(file))

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
