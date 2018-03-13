const { Writable } = require('stream')

module.exports = class BufferedQueueStream extends Writable {
  constructor(queue) {
    super()
    this.queue = queue
  }

  _write(chunk, encoding, done) {
    console.log('adding: ', chunk)
    this.queue.add(chunk)
    done()
  }
}
