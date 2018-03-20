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

  getValueFromEnv(key) {
    // helloWorld => HELLO_WORLD
    // key1 => KEY_1
    key = _.upperCase(key).replace(/\s/g, '_')

    if (!process.env.hasOwnProperty(key)) return undefined

    return process.env[key] || ''
  }

  get(key, defaultValue) {
    let value = this.getValueFromEnv(key)
    if (value !== undefined) { return value }

    value = dot.pick(key, this)
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
        return value
          .then(v => v === undefined ? defaultValue : v)
          .catch(function(err) {
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
      provider = new CachingProxy(cache, provider, opts.cache.ttl || DEFAULT_TTL_SEC)
    }
    this.namespaceProviders[namespace] = provider
  }

  async initialize() {
    return this.loadFrom([this.__app.quadroDir, this.__app.appDir])
  }

  buildConfigSearchDirs(dirs) {
    let searchDirs = dirs.map(d => [
      path.join(d, 'config'),
      path.join(d, `config/${this.__app.env}`)
    ])
    if (this.__app.env !== 'test') {
      searchDirs = searchDirs.concat(dirs.map(d =>
        path.join(d, 'config/local')
      ))
    }
    return _.flatten(searchDirs)
  }

  async loadFrom(dirs) {
    let configDirs = this.buildConfigSearchDirs(dirs)
    let names = await this.getDistinctConfigNames(configDirs)
    await this.loadConfigs(names, configDirs)
  }

  async getDistinctConfigNames(dirs) {
    let configFiles = this.__app.glob(`*.${EXTENSION_PATTERN}`, { dirs })

    return Promise.map(configFiles, _ => path.basename(_, path.extname(_)))
  }

  async loadConfigs(names, dirs) {
    return Promise.map(names, name => this.loadConfig(name, dirs))
  }

  async loadConfig(name, dirs) {
    let files = this.__app.glob(`${name}.${EXTENSION_PATTERN}`, { dirs })
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
