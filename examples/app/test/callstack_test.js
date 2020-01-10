const callstack = require('../../../lib/callstack.js')

describe('Callstack', () => {
  it('detects correct calling function', () => {
    function fn2() {
      return [0].map(() => callstack.getCaller())[0]
    }

    function fn1() {
      return fn2()
    }

    const res = fn1()
    console.log(res)
    expect(res.function).to.equal('fn1')
    expect(res.file).to.equal('callstack_test')
  })
})
