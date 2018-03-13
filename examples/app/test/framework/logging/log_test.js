describe('Logger', function() {
  afterEach(async function() {
    QT.restoreConfig('quadro.logger.logstash')
    await Q.log.reload()
  })

  describe('logstash', function() {
    it('is enabled if quadro.logger.logstash is set', async function() {
      QT.stubConfig('quadro.logger.logstash', 'tcp://localhost:2000')

      let spy = this.sinon.stub(Q.log.LogStashStream, 'createStream')

      await Q.log.reload()

      expect(spy).to.have.been.calledWith({ port: 2000, host: 'localhost' })
    })

    it('validates url starts with tcp', async function() {
      QT.stubConfig('quadro.logger.logstash', 'udp://localhost:2000')
      this.sinon.stub(Q.log.LogStashStream, 'createStream')

      await expect(Q.log.reload()).to.be.rejectedWith(Q.Errors.ConfigurationError)
    })
  })

  describe('logger', function() {
    it('converts Maps to objects', function() {
      let spy = this.sinon.stub(Q.log.logger, 'info').callsFake(() => null)
      Q.log.info({ hello: new Map([[1, 2], [3, 4]]) })
      expect(spy).to.have.been.calledWith(this.sinon.match.containSubset({
        hello: { '1': 2, '3': 4 }
      }))
    })

    it('converts Sets to arrays', function() {
      let spy = this.sinon.stub(Q.log.logger, 'info').callsFake(() => null)
      Q.log.info({ hello: new Set([1, 2, 3]) })
      expect(spy).to.have.been.calledWith(this.sinon.match.containSubset({
        hello: [1, 2, 3]
      }))
    })
  })

  describe('registerStream', function() {
    const { Writable } = require('stream')

    it('adds the stream for logging', function() {
      const write = this.sinon.spy()
      class Stream extends Writable {
        constructor() { super() }
        _write() { write(...arguments) }
      }
      const stream = new Stream()
      Q.log.registerStream({ stream })
      Q.log.info('Hello')

      expect(write).to.have.been.calledWith(this.sinon.match.instanceOf(Buffer))
    })
  })
})
