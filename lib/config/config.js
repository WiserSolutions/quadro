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
      path.join(app.quadroDir, `config/${app.env}`),
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

    return provider.set(key, value)
  }

  get(key, defaultValue) {
    let value = dot.pick(key, this)
    if (value !== undefined) return value

    // Strip key after first dot
    let namespace = key.replace(/\..*$/, '')

    let provider = this.namespaceProviders[namespace]
    if (provider) {
      let getter = typeof provider.get === 'function' ? provider.get : provider

      // Get string before dot
      let accessorName = key.replace(/^.*?\./, '')
      let value = getter.apply(provider, [accessorName])

      if (value && typeof value.then === 'function') {
        return value.catch(function(err) {
          Q.log.error({ err, namespace, key }, 'Configuration provider error')
          return defaultValue
        })
      } else return value
    }
    return defaultValue
  }

  async registerConfigRoot(namespace, provider, opts) {
    opts = opts || {}
    if (opts.cache) {
      const DEFAULT_TTL_SEC = 30
      const CachingProxy = require('./caching_proxy')
      let cache = await Q.container.getAsync('cache')
      provider = new CachingProxy(cache, provider, opts.ttl || DEFAULT_TTL_SEC)
    }
    this.namespaceProviders[namespace] = provider
  }

  async initialize() {
    let names = await this.getDistinctConfigNames()
    await this.loadConfigs(names)
  }

  async getDistinctConfigNames() {
    let configFiles = this.__app.glob(`*.${EXTENSION_PATTERN}`, {
      dirs: this.configDirs
    })

    return Promise.map(configFiles, _ => path.basename(_, path.extname(_)))
  }

  async loadConfigs(names) {
    return Promise.map(names, name => this.loadConfig(name))
  }

  async loadConfig(name) {
    let files = this.__app.glob(`${name}.${EXTENSION_PATTERN}`, {
      dirs: this.configDirs
    })
    let configs = await Promise.map(files, file => this.parseConfig(file))

    this[name] = _.merge(...configs)
  }

  async parseConfig(file) {
    let ext = path.extname(file)
    if (ext === '.json' || ext === '.js') return require(file)
    if (ext === '.yaml' || ext === '.yml') {
      let yaml = require('js-yaml')
      return yaml.safeLoad(await fs.readFile(file))
    }

    console.log(`Warning: don't know how to parse file ${file}. Ignoring...`)
    return {}
  }
}
