const Parser = require('espree')
const CLASS_TYPES = ['ClassDeclaration', 'ClassExpression']
const FUNC_TYPES = ['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression']

/**
 * module - Parses the provided service and returns
 *
 * @param  {Object} service Service construct to parse
 * @return {Object} { isConstructor: Boolean, paramNames: Array[String] }
 */
module.exports = function(service) {
  let fullAST = Parser.parse('let a = ' + service.toString(), {
    ecmaVersion: 8
  })
  let { body: [{ declarations: [{init: ast}] }] } = fullAST

  let paramNames = []
  let isConstructor = false

  if (FUNC_TYPES.includes(ast.type)) {
    if (ast.id) {
      let { id: { name } } = ast
      isConstructor = isConstructorFunctionName(name)
    }
    paramNames = getParamNames(ast.params)
  } else if (CLASS_TYPES.includes(ast.type)) {
    isConstructor = true
    let { body/* ClassBody */: { body } } = ast
    let ctor = body.find(isConstructorNode)
    if (ctor) paramNames = getParamNames(ctor.value.params)
  }

  return { paramNames, isConstructor }
}

function isConstructorFunctionName(name) {
  return name[0] >= 'A' && name[0] <= 'Z'
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

function isConstructorNode(ast) {
  return ast.type === 'MethodDefinition' &&
    ast.key && ast.key.type === 'Identifier' &&
    ast.key.name === 'constructor'
}
