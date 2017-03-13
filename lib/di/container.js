const Parser = require('espree')
const co = require('co')

module.exports = class Container {
  constructor(parent = null) {
    this.map = new Map()
    this.parent = parent
  }

  register(name, svc, lifetime = 'transient') {
    let factory = this.createFactory(svc)
    return this.map.set(name, { factory, lifetime })
  }

  registerSingleton(name, svc) {
    return this.register(name, svc, 'singleton')
  }

  createNested() {
    return new Container(this)
  }

  getDescriptor(name) {
    return this.map.get(name) || (this.parent && this.parent.getDescriptor(name))
  }

  get(name, allowAsync = false) {
    let descriptor = this.getDescriptor(name)
    if (!descriptor) throw new Error(`'${name}' can not be resolved`)
    let { factory, lifetime, instance } = descriptor
    if (!factory) throw new Error(`Unregistered dependency ${name}`)

    if (instance) return instance

    instance = factory()
    if (instance && typeof instance.then === 'function' && !allowAsync) {
      throw new Error('Safety net: `get` used async services - use `getAsync` instead')
    }

    if (lifetime === 'singleton') descriptor.instance = instance

    return instance
  }

  async getAsync(name) {
    return await this.get(name, true)
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

  create(klass) {
    return this.createFactory(klass)()
  }

  run(func, _this) {
    return this.createFactory(func, _this)({ _this })
  }

  createFactory(svc) {
    if (typeof svc !== 'function') return () => svc

    let fullAST = Parser.parse('let a = ' + svc.toString(), {
      ecmaVersion: 8
    })
    let { body: [{ declarations: [{init: ast}] }] } = fullAST

    let classTypes = ['ClassDeclaration', 'ClassExpression']
    if (classTypes.includes(ast.type)) {
      return this.createClassFactory(svc, ast)
    }
    let funcTypes = ['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression']
    if (funcTypes.includes(ast.type)) {
      return this.createFunctionFactory(svc, ast)
    }
    return () => svc
  }

  createClassFactory(klass, { body/* ClassBody */: { body } }) {
    let paramNames = []
    let ctor = body.find(isConstructor)
    if (ctor) paramNames = getParamNames(ctor.value.params)
    return () => createInstance(klass, true, paramNames, this)
  }

  createFunctionFactory(svc, { params }) {
    let paramNames = getParamNames(params)
    return () => createInstance(svc, false, paramNames, this)
  }
}

function createInstance(Func, isConstructor, paramNames, resolver) {
  let paramValues = paramNames.map(_ => resolver.get(_, true))
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
  if (isGeneratorFunction(svc.initialize)) {
    return co(svc.initialize()).then(() => svc)
  }
  let result = svc.initialize()
  if (result && result.then && typeof result.then === 'function') {
    return result.then(() => svc)
  }
  return svc
}

function isGenerator(obj) {
  return typeof obj.next === 'function' && typeof obj.throw === 'function'
}

/**
 * isGeneratorFunction - Check if obj is a generator function
 *
 * @param  {Object} obj object to test
 * @return {Boolean}    true if obj is a generator function, false - otherwise
 */
function isGeneratorFunction(obj) {
  let constructor = obj.constructor
  if (!constructor) return false
  if (constructor.name === 'GeneratorFunction' || constructor.displayName === 'GeneratorFunction') return true
  return isGenerator(constructor.prototype)
}

function getParamNames(paramsAST) {
  return paramsAST.map(getParamName)
}

function getParamName(paramAST) {
  if (paramAST.type === 'Identifier') return paramAST.name
  if (paramAST.type === 'AssignmentPattern') {
    let { left, right } = paramAST
    if (left && left.type === 'Identifier') return left.name
    if (right && right.type === 'Identifier') return right.name
  }
  throw new Error('Unable to figure out dependency name')
}

function isConstructor(ast) {
  return ast.type === 'MethodDefinition' &&
    ast.key && ast.key.type === 'Identifier' &&
    ast.key.name === 'constructor'
}