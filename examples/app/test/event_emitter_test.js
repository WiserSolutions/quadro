describe('Q.EventEmitter', function() {
  class TestEmitter extends Q.EventEmitter {
  }

  let emitter
  beforeEach(function() {
    emitter = new TestEmitter()
  })

  describe('on', function() {
    it('adds async functions to ._asyncHandlers', function() {
      let func = async function() {}
      emitter.on('someEvent', func)
      let handlers = emitter._emitHandlers['someEvent']
      expect(handlers[0]).to.equal(func)
    })
  })

  describe('emit', function() {
    it('runs handler', function() {
      let spy = this.sinon.spy()
      emitter.on('someEvent', spy)
      emitter.emit('someEvent', 123)
      expect(spy).to.have.been.calledWith(123)
    })

    it('runs async handlers', async function() {
      let spy = this.sinon.spy()
      emitter.on('someEvent', param => Promise.delay(50).then(_ => spy(param)))
      await emitter.emit('someEvent', 246)
      expect(spy).to.have.been.calledWith(246)
    })
  })
})
