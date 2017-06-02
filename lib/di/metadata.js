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

  // function(a = ...)
  if (paramAST.type === 'AssignmentPattern') {
    let identifier = extractIdentifierFromAssignment(paramAST)
    if (identifier) return identifier
  }
  throw new Error('Unable to figure out dependency name')
}

/**
 * extractIdentifierFromAssignment - Extracts identifiers from assignment ASTs:
 *
 * @param  {AST} ast parameter AST
 * @return {String} Indentifier name
 * @example Allows extracting parameter names from constructs like:
 *  function foo(a)
 *  function foo(a = { config })
 *  function foo({ config } = a)s
 *  function foo({a} = (++cov_1675t557gb.b[0][0], dep))
 *  NOTE: In the last example the test coverage tool inserted the ++cov instrumentation
 *
 */
function extractIdentifierFromAssignment(ast) {
  let { left, right } = ast
  if (left && left.type === 'Identifier') {
    // For default literals: function(a = 'svc:test')
    if (right.type === 'Literal') return right.value
    if (right.type === 'SequenceExpression') {
      let identifier = getIdentifierFromCodeCov(right)
      if (identifier) return identifier
    }

    // Probably destructuring?
    return left.name
  }
  if (right && right.type === 'Identifier') return right.name
  return getIdentifierFromCodeCov(right)
}

function getIdentifierFromCodeCov(ast) {
  // Handle nyc instrumentation
  let { type: seqExprType, expressions: [
    { operator: firstExprOperator },
    { type: secondExprType, name, value }
  ] } = ast

  // Handle cases of this type:
  // function({a} = (++cov_1675t557gb.b[0][0], dep))
  // function(a = (++cov_1675t557gb.b[1][0], 'something:a'))
  let isCodeCov = seqExprType === 'SequenceExpression' &&
    firstExprOperator === '++'
  if (isCodeCov) {
    if (secondExprType === 'Identifier') return name
    if (secondExprType === 'Literal') return value
  }
}

function isConstructorNode(ast) {
  return ast.type === 'MethodDefinition' &&
    ast.key && ast.key.type === 'Identifier' &&
    ast.key.name === 'constructor'
}
