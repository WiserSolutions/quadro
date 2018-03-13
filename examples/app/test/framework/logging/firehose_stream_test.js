const { Writable } = require('stream')

const FirehoseInit = require('quadro/lib/logger/firehose/initializer')

const STREAM_NAME_KEY = 'quadro.logger.kinesis.firehose_stream'

describe('Firehose logging', function() {
  describe('FirehoseInitializer', function() {
    describe('.get()', function() {
      it('returns null if firehose not configured', function() {
        QT.stubConfig(STREAM_NAME_KEY)
        expect(FirehoseInit.get()).to.be.undefined
      })

      it('returns FirehoseInitializer if firehose configured', function() {
        QT.stubConfig(STREAM_NAME_KEY, 'something')
        expect(FirehoseInit.get()).to.be.equal(FirehoseInit)
      })
    })

    describe('the initializer', function() {
      it('adds a stream to logger', async function() {
        const match = this.sinon.match

        const log = { registerStream: this.sinon.spy() }
        await Q.container.create(FirehoseInit, { args: { log } })
        expect(log.registerStream)
          .to.have.been.calledWith({ stream: match.instanceOf(Writable) })
      })
    })
  })
})
