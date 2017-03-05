const Parser = require('espree')

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
    if (typeof svc !== 'function') return () => svc

    let fullAST = Parser.parse('let a = ' + svc.toString(), {
      ecmaVersion: 8
    })
    let { body: [{ declarations: [{init: ast}] }] } = fullAST
    log.info({ ast })

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
    return function() {
      let resolvedValues = paramNames.map(name => this.get(name))
      return new klass(...resolvedValues)
    }.bind(this)
  }

  createFunctionFactory(svc, { params }) {
    let paramNames = getParamNames(params)
    return function() {
      let resolvedValues = paramNames.map(name => this.get(name))
      return svc(...resolvedValues)
    }.bind(this)
  }
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
