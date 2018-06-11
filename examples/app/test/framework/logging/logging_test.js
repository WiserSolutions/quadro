const STDOUT = require('test-console').stdout
const stripAnsi = require('strip-ansi')

describe('Logging', function() {
  it('outputs nested errors', function() {
    const NestedError = Q.Errors.declare('NestedError')
    const TopLevelError = Q.Errors.declare('TopLevelError', 'Default message')

    let err = new TopLevelError('something happened', {a: 1}, new NestedError('because of this'))
    let output = STDOUT.inspectSync(function() {
      Q.log.error({ err })
    }).map(stripAnsi)
    expect(output).to.containSubset([
      ' TopLevelError: something happened ( a: 1 )\n',
      '     NestedError: because of this \n'
    ])
  })

  describe('diagnostics streams', function() {
    const { Writable } = require('stream')
    class TestWriteStream extends Writable {
      constructor() { super({ objectMode: true }) }
      _write(chunk, encoding, done) {
        lastWrittenObject = chunk
        done()
      }
    }

    let lastWrittenObject

    describe('audit()', function() {
      it('writes audit entry', function() {
        Q.log._auditLogger.addStream({ type: 'raw', stream: new TestWriteStream() })

        Q.log.audit('order', 'SKU1', 'completed', { group: 'Kitchen', extra: { hello: 'world' } })
        expect(lastWrittenObject).to.deep.include({
          name: Q.app.name,
          object: 'SKU1',
          status: 'completed',
          hostname: require('os').hostname(),
          action: 'order',
          group: 'Kitchen',
          extra: { hello: 'world' }
        })
      })
    })

    describe('metric()', function() {
      beforeEach(async function() {
        QT.stubConfig('quadro.logger.metrics_flush_interval', 60)

        this.clock = this.sinon.useFakeTimers(0)
        await Q.log.initialize()
      })
      afterEach(function() { this.clock.restore() })

      it('aggregates and writes metrics', function () {
        const types = ['standard']
        Q.log._metricLogger.logger.addStream({ type: 'raw', stream: new TestWriteStream() })

        Q.log.metric('orders', { department: 'footwear', types }, { count: 1, sum: 5 })
        Q.log.metric('orders', { department: 'drugs' }, { count: 2, sum: 3 })

        this.clock.tick(30001)
        Q.log.metric('orders', { department: 'footwear', types }, { count: 2, sum: 3 })

        this.clock.tick(30000)
        Q.log.metric('orders', { department: 'drugs' }, { count: 4, sum: 100 })

        expect(lastWrittenObject).to.deep.include({
          batch: [
            { d: { department: 'footwear', metric: 'orders', types }, count: 3, sum: 8, time: 0 },
            { d: { department: 'drugs', metric: 'orders' }, count: 2, sum: 3, time: 0 }
          ]
        })
      })
    })

    describe('event()', function() {
      it('writes audit entry', function() {
        Q.log._eventLogger.addStream({ type: 'raw', stream: new TestWriteStream() })

        Q.log.event('order.completed', {
          department: 'footwear',
          userId: 'John1',
          orderTotal: 123.4
        })
        expect(lastWrittenObject).to.deep.include({
          messageType: 'order.completed',
          department: 'footwear',
          userId: 'John1',
          orderTotal: 123.4
        })
      })
    })
  })
})
