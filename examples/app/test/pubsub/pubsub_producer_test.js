/* eslint no-unused-expressions: 0 */
const amqp = require('amqplib')

describe('pubsub', function() {
  let pubsub

  beforeEach(async function() {
    pubsub = await Q.container.getAsync('pubsub')
  })

  describe('publish', function() {
    let connection
    let channel

    beforeEach(async function() {
      connection = await amqp.connect(Q.config.get('service.messages.host'))
      channel = await connection.createChannel()
    })

    afterEach(async function() {
      await channel.close()
      await connection.close()
    })

    it('publishes a message', async function() {
      // Get the channel
      await channel.assertExchange('orders.test.producer', 'fanout', {durable: false})
      await channel.assertQueue('service_producer_queue')
      await channel.bindQueue('service_producer_queue', 'orders.test.producer', '')
      let handler = this.sinon.spy()
      let tag = await channel.consume('service_producer_queue', handler, {noAck: true})

      // Send a message through pub sub
      pubsub.publish('orders.test.producer', { hello: 'world' })
      await Promise.delay(200)
      await channel.cancel(tag.consumerTag)
      expect(handler.called).to.be.true
      expect(JSON.parse(handler.args[0][0].content.toString())).to.be.eql({messageType: 'orders.test.producer', content: {hello: 'world'}})
    })
  })
})
