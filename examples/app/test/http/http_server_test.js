const Server = require('../../../../services/http_server')

/* eslint no-unused-expressions: 0 */
describe('HTTP Server', function() {
  describe('Socket listen', function() {
    let listenSpy, container
    beforeEach(async function() {
      listenSpy = this.sinon.spy()
      container = { create: () => ({ listen() { listenSpy() } }) }
    })

    it('starts listening', async function() {
      await Server(container, Q.app, Q.config)
      expect(listenSpy).to.have.been.called
    })

    context('Task mode', function() {
      beforeEach(function() { this.sinon.stub(Q.app, 'isTask').value(true) })

      it('does not start listening', async function() {
        await Server(container, Q.app, Q.config)
        expect(listenSpy).to.not.have.been.called
      })
    })

    context('REPL mode', function() {
      beforeEach(function() { this.sinon.stub(Q.app, 'isREPL').value(true) })

      it('does not start listening', async function() {
        await Server(container, Q.app, Q.config)
        expect(listenSpy).to.not.have.been.called
      })

      context('quadro.http.force is true', function() {
        beforeEach(function() { QT.stubConfig('quadro.http.force', true) })

        it('starts listening', async function() {
          await Server(container, Q.app, Q.config)
          expect(listenSpy).to.have.been.called
        })
      })
    })
  })
})
