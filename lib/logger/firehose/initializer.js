const STREAM_NAME_KEY = 'quadro.logger.kinesis.firehose_stream'

module.exports = class FirehoseInitializer {
  constructor(aws, log, config) {
    this.aws = aws
    this.log = log
    this.config = config
    this.firehoseClient = new aws.Firehose()
    this.deliveryStreamName = config.get(STREAM_NAME_KEY)
  }

  initialize() {
    this.queue = this._createBufferedQueue()

    const BufferedQueueStream = require('./buffered_queue_stream')

    this.log.registerStream({ stream: new BufferedQueueStream(this.queue) })
  }

  _onQueueFlush(data) {
    this.firehoseClient
      .putRecordBatch({
        DeliveryStreamName: this.deliveryStreamName,
        Records: data.map(r => ({ Data: r }))
      })
      .promise()
      .catch(err => console.log(err))
  }

  _createBufferedQueue() {
    const BufferedQueue = require('buffered-queue')
    const maxBufferSize = this.config.get('quadro.logger.kinesis.max_buffer_size', 500)
    const queue = new BufferedQueue({
      size: maxBufferSize,
      flushTimeout: this.config.get('quadro.logger.kinesis.buffer_timeout_ms', 5000)
    })

    queue.on('flush', (data) => this._onQueueFlush(data))

    return queue
  }

  static get() {
    if (!Q.config.get(STREAM_NAME_KEY)) return

    return FirehoseInitializer
  }
}
