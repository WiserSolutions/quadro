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
  })
})
