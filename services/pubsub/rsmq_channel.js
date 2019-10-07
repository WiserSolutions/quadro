const RedisSMQ = require('rsmq')
const redis = require('redis')
const _ = require('lodash')
Promise.promisifyAll(redis.RedisClient.prototype)
Promise.promisifyAll(redis.Multi.prototype)

Q.Errors.declare('PubsubConsomerAlreadyStartedError', 'One Consumer already started. No new consumer can be started again')

module.exports = class RedisSimpleMqChannel {
  constructor(host, retryDelay) {
    this.host = host
    this.retryDelay = retryDelay
  }

  async initialize(retry = false) {
    try {
      this.rdb = redis.createClient({ host: this.host })
      // have to create a second connection for receiving subscribe events
      this.subscriberRdb = redis.createClient({ host: this.host })
      this.rsmq = new RedisSMQ({ client: this.rdb, realtime: true })

      // On connection close retry to initialize after few minutes
      this.rdb.on('close', async (err) => {
        Q.log.info({err}, `Redis MQ connection closed. Retrying to connect after ${this.retryDelay}ms`)
        await this.handleError()
      })
    } catch (err) {
      if (retry) {
        Q.log.error({err}, `Error while connecting to redis mq. Retrying to connect after ${this.retryDelay}ms`)
        this.handleError()
      } else {
        throw err
      }
    }
  }

  async publish(messageType, message) {
    let queues = await this.rdb.smembers(`exchanges:${messageType}`)

    await Promise.all(queues.map(async (queue) => {
      try {
        await this.rsmq.sendMessageAsync({
          qname: queue,
          message: JSON.stringify(message)
        })
      } catch (err) {
        // TODO: intelligent handle/retry
      }
    }))
  }

  async startConsumer(queueName, concurrency, messageHandler) {
    if (!this.queueName) {
      this.queueName = queueName
      this.concurrency = concurrency
      this.messageHandler = messageHandler
      return this._startConsumerInternal()
    } else {
      throw new Q.Errors.PubsubConsomerAlreadyStartedError({existingQueue: this.queueName, newQueue: queueName})
    }
  }

  async _startConsumerInternal() {
    if (!this.queueName) return
    // Make sure queue exists
    await this.rsmq.createQueueAsync({
      qname: this.queueName,
      vt: 600,
      maxsize: 1000000
    })

    this.workers = _.fill(new Array(this.concurrency), false)

    this.subscriberRdb.on('message', (channel, msg) => {
      // only receive message if first worker is not active
      if (!this.workers[0]) {
        this.receiveMessage(0)
      }
    })
    this.subscriberRdb.subscribe(`rsmq:rt:${this.queueName}`)

    // make sure we flush any messages that are currently in there
    this.receiveMessage(0)
  }

  // accepts a single message, then spawns more listeners
  async receiveMessage(number) {
    this.workers[number] = true

    let msg = await this.rsmq.receiveMessageAsync({
      qname: this.queueName
    })

    if (_.isNil(msg) || !_.keys(msg).length) {
      this.workers[number] = false
      return
    }

    try {
      // Process message
      await this.messageHandler(JSON.parse(msg.message))
      // Acknowledge message. General error should be taken care by handler
      // and use mongo to schedule event
      await this.rsmq.deleteMessageAsync({
        qname: this.queueName,
        id: msg.id
      })
    } catch (err) {
      // Unacknowledge only in case there is unhandled message
      await this.rsmq.changeMessageVisibilityAsync({
        qname: this.queueName,
        id: msg.id,
        vt: 0
      })
    }

    this.workers[number] = false

    // spawn one, maybe two more workers in our place if concurrency allows
    this.receiveMessage(number)
    if (number + 1 < this.concurrency && !this.workers[number + 1]) {
      this.receiveMessage(number + 1)
    }
  }

  async handleError() {
    this.connection.quit()

    setTimeout(async () => {
      await this.initialize(true)
      await this._startConsumerInternal()
    }, this.retryDelay)
  }
}
