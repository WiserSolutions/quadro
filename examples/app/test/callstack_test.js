const callstack = require('../../../lib/callstack.js')

describe('Callstack', () => {
  it('detects correct calling function', () => {
    function fn2() {
      return [0].map(function named() { return callstack.getCaller() })[0]
    }

    function fn1() {
      return fn2()
    }

    const res = fn1()
    // this is a non-ideal test, would rather use a lambda instaed of `named` and verify we 
    // get fn1, however, until node v12, it will name the lambda 'map' which means it will still
    // find the answer to be fn2 instead of fn1
    expect(res.name).to.equal('fn2')
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
