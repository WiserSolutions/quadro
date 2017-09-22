const STDOUT = require("test-console").stdout
const stripAnsi = require('strip-ansi')

describe('Logging', function() {
  it('outputs nested errors', function() {
    const NestedError = Q.Errors.declareError('NestedError')
    const TopLevelError = Q.Errors.declareError('TopLevelError', 'Default message')

    let err = new TopLevelError('something happened', {a: 1}, new NestedError('because of this'))
    let output = STDOUT.inspectSync(function() {
      Q.log.error({ err })
    }).map(stripAnsi)
    expect(output).to.containSubset([
      ' TopLevelError: something happened ( a: 1 )\n',
      '     NestedError: because of this \n'
    ])
  })
})
