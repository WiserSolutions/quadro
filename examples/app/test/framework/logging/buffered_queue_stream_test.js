const BufferedQueueStream = require('quadro/lib/logger/firehose/buffered_queue_stream')

describe('BufferedQueueStream', function() {
  it('adds the chunk to the queue', async function() {
    const queue = { add: this.sinon.spy() }
    new BufferedQueueStream(queue).write('hello')
    expect(queue.add).to.have.been.calledWith(Buffer.from('hello'))
  })
})
