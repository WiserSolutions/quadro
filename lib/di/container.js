const _ = require('lodash')
const parse = require('./metadata')

const DEFAULT_REGISTRATION_OPTS = {
  lifetime: 'transient',
  type: 'auto'
}

module.exports = class Container {
  constructor(parent = null) {
    this.map = new Map()
    this.parent = parent

    this.registerSingleton('container', this, { type: 'value' })
  }

  register(name, svc, opts = DEFAULT_REGISTRATION_OPTS) {
    let { lifetime = 'transient', aliases } = (opts || {})

    let factory = this.createFactory(svc, opts)
    let descriptor = { factory, lifetime, definition: svc }
    this.map.set(name, descriptor)
    for (var alias of aliases || []) {
      this.map.set(alias, descriptor)
    }
  }

  registerSingleton(name, svc, opts) {
    return this.register(name, svc, _.merge({ lifetime: 'singleton' }, opts))
  }

  createNested() {
    return new Container(this)
  }

  getDescriptor(name) {
    return this.map.get(name) || (this.parent && this.parent.getDescriptor(name))
  }

  getDefinition(name) {
    return this.getDescriptor(name).definition
  }

  get(name, opts) {
    let { allowAsync, doNotThrow } = opts || {}

    let descriptor = this.getDescriptor(name)
    if (!descriptor) {
      if (doNotThrow) return null
      throw new Error(`'${name}' can not be resolved`)
    }
    let { factory, lifetime, instance } = descriptor
    if (!factory) throw new Error(`Unregistered dependency ${name}`)

    if (instance) return instance

    instance = factory()
    if (instance && typeof instance.then === 'function' && !allowAsync) {
      throw new Error(`Safety net: 'get' used for async service ${name} - use 'getAsync' instead`)
    }

    if (lifetime === 'singleton') descriptor.instance = instance

    return instance
  }

  try(name, opts) {
    return this.get(name, _.merge(opts, { doNotThrow: true }))
  }

  async getAsync(name, opts) {
    return this.get(name, _.merge(opts, { allowAsync: true }))
  }

  async tryAsync(name, opts) {
    return this.try(name, _.merge(opts, { allowAsync: true }))
  }

  find(pattern) {
    let result = []
    for (var [key] of this.map) {
      let match = !pattern ||
        (pattern instanceof RegExp && pattern.test(key)) ||
        (typeof pattern === 'string' && key.includes(pattern))
      if (match) result.push(key)
    }
    return this.parent ? result.concat(this.parent.find(pattern)) : result
  }

  create(klass, opts) {
    return this.createFactory(klass, opts)()
  }

  run(func, opts) {
    return this.create(func, opts)
  }

  createFactory(svc, opts) {
    let { type, args } = opts || DEFAULT_REGISTRATION_OPTS
    if (typeof svc !== 'function') return () => svc

    let metadata = parse(svc)

    if (!type || type === 'auto') {
      type = metadata.isConstructor ? 'class' : 'factory'
    }

    switch (type) {
      case 'class': return this.createClassFactory(svc, metadata.paramNames, args)
      case 'factory': return this.createFunctionFactory(svc, metadata.paramNames, args)
      default: return () => svc
    }
  }

  createClassFactory(klass, paramNames, adhocDependencies) {
    return () => createInstance(klass, true, paramNames, this, adhocDependencies)
  }

  createFunctionFactory(svc, paramNames, adhocDependencies) {
    return () => createInstance(svc, false, paramNames, this, adhocDependencies)
  }
}

function createInstance(Func, isConstructor, paramNames, resolver, adhocDependencies) {
  adhocDependencies = adhocDependencies || {}
  let paramValues = paramNames.map(_ => adhocDependencies[_] || resolver.get(_, { allowAsync: true }))
  let create = (...args) => isConstructor ? initialize(new Func(...args)) : Func(...args)
  if (isPromise(paramValues)) {
    return Promise.all(paramValues).then((args) => create(...args))
  } else {
    return create(...paramValues)
  }
}

function isPromise(obj) {
  if (!obj) return false
  if (typeof obj.then === 'function') return true
  return obj instanceof Array && obj.some(isPromise)
}

function initialize(svc) {
  if (!svc || !svc.initialize) return svc
  let result = svc.initialize()
  if (result && result.then && typeof result.then === 'function') {
    return result.then(() => svc)
  }
  return svc
}
