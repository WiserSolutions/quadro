const Parser = require('espree')
const co = require('co')

module.exports = class Container {
  constructor(parent = null) {
    this.map = {}
    this.parent = parent
  }

  register(name, svc) {
    return this.map[name] = this.createFactory(svc)
  }

  createNested() {
    return new Container(this)
  }

  getFactory(name) {
    return this.map[name] || this.parent && this.parent.getFactory(name)
  }

  get(name, allowAsync = false) {
    let factory = this.getFactory(name)
    if (!factory) throw new Error(`Unregistered dependency ${name}`)

    let result = factory()
    if (result && typeof result.then === 'function' && !allowAsync) throw new Error(
      'Safety net: `get` used async services - use `getAsync` instead'
    )
    return result
  }

  async getAsync(name) {
    return await this.get(name, true)
  }

  create(klass) {
    return this.createFactory(klass)()
  }

  run(func) {
    return this.createFactory(func)()
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

  createClassFactory(klass, { /* ClassBody */ body: { body }}) {
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

function createInstance(func, isConstructor, paramNames, resolver) {
  let paramValues = paramNames.map(_ => resolver.get(_, true))
  let create = (...args) => isConstructor ? initialize(new func(...args)) : func(...args)
  if (isPromise(paramValues)) {
    return Promise.all(paramValues).then((args) => initialize(create(...args)))
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
  if (!svc.initialize) return svc
  if (isGeneratorFunction(svc.initialize)) {
    return co(svc.initialize()).then(() => svc)
  }
  let result = svc.initialize()
  // log.info({ type: typeof svc.initialize })
  if (result && result.then && typeof result.then === 'function') {
    return result.then(() => svc)
  }
  return svc
}


function isGenerator(obj) {
  return 'function' == typeof obj.next && 'function' == typeof obj.throw;
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
   if ('GeneratorFunction' === constructor.name || 'GeneratorFunction' === constructor.displayName) return true;
   return isGenerator(constructor.prototype);
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
