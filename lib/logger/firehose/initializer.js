const STREAM_NAME_KEY = 'quadro.logger.kinesis.firehose_stream'

module.exports = class FirehoseInitializer {
  constructor(config, log, aws) {
    const firehoseClient = new aws.Firehose()

    const streamName = config.get(STREAM_NAME_KEY)
    const writer = this._createFirehoseWriter(streamName, {
      firehoseClient,
      log: (level, msg, params) => log[level](params, msg),
      maxSize: config.get('quadro.logger.kinesis.max_size', 100000),
      maxCount: config.get('quadro.logger.kinesis.max_count', 500),
      maxTimeout: config.get('quadro.logger.kinesis.max_timeout', 60)
    })

    log.registerStream({ type: 'raw', stream: this._createWritableStream(writer) })
  }

  static get() {
    if (!Q.config.get(STREAM_NAME_KEY)) return

    return FirehoseInitializer
  }

  _createFirehoseWriter(streamName, options) {
    const FirehoseWriter = require('firehose-writer')
    const defaultOptions = { streamName }
    return new FirehoseWriter({ ...defaultOptions, ...options })
  }

  _createWritableStream(firehoseWriter) {
    const { Writable } = require('stream')

    class FirehoseStream extends Writable {
      constructor() {
        super({ objectMode: true })
      }

      _write(chunk, encoding, done) {
        firehoseWriter.put(chunk)
        done()
      }
    }

    return new FirehoseStream()
  }
}
