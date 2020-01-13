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
    expect(res.name).to.equal('fn1')
    expect(res.file).to.equal('callstack_test')
  })

  it('handles aliases', () => {
    const obj = {}
    function wrapper() {
      return callstack.getCaller()
    }
    obj.fn = wrapper

    function caller() {
      return obj.fn()
    }
    const res = caller()
    expect(res.name).to.equal('caller')
    expect(res.file).to.equal('callstack_test')
  })
})
