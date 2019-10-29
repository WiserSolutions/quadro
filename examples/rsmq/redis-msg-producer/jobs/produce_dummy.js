let counter = 0

module.exports = class {
  constructor(pubsub) {
    this.pubsub = pubsub
  }

  async run(pubsub) {
    counter += 1

    await this.pubsub.publish('dummy.msg', { msg: 'I am a counter', value: counter })
  }

  getCounter() {
    return counter
  }
}

module.exports['@interval'] = 3
