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
      constructor() { super({ objectMode: true })}
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
      it('writes audit entry', function() {
        Q.log._metricLogger.addStream({ type: 'raw', stream: new TestWriteStream() })

        Q.log.metric('orders', { department: 'footwear' }, { count: 1, sum: 5 })
        expect(lastWrittenObject).to.deep.include({
          d: {
            metric: 'orders',
            department: 'footwear'
          },
          count: 1,
          sum: 5,
          hostname: require('os').hostname(),
          name: Q.app.name
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
