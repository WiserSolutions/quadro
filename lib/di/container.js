const esprima = require('esprima')

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

  get(name) {
    let factory = this.getFactory(name)
    if (!factory) throw new Error(`Unregistered dependency ${name}`)

    return factory()
  }

  createFactory(svc) {
    let { body: [{ declarations: [{init: ast}] }] } = esprima.parse('let a = ' + svc.toString(), { sourceType: 'module' })
    log.info({ ast })
    if (ast.type === 'ClassDeclaration' || ast.type === 'ClassExpression') {
      return this.createClassFactory(svc, ast)
    }
    if (ast.type === 'FunctionDeclaration' || ast.type === 'FunctionExpression') {
      return this.createFunctionFactory(svc, ast)
    }
    return () => svc
  }

  createClassFactory(klass, { /* ClassBody */ body: { body }}) {
    let paramNames = []
    let ctor = body.find(isConstructor)
    if (ctor) paramNames = ctor.value.params.map(_ => _.name)
    return function() {
      let resolvedValues = paramNames.map(name => this.get(name))
      return new klass(...resolvedValues)
    }.bind(this)
  }

  createFunctionFactory(svc, { params }) {
    let paramNames = params.map(_ => _.name)
    return function() {
      let resolvedValues = paramNames.map(name => this.get(name))
      return svc(...resolvedValues)
    }.bind(this)
  }
}

function isConstructor(ast) {
  return ast.type === 'MethodDefinition' &&
    ast.key && ast.key.type === 'Identifier' &&
    ast.key.name === 'constructor'
}
