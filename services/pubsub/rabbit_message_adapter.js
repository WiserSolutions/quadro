const amqp = require('amqplib')

module.exports = class RabbitMqMessageAdapter {
  constructor(log, config, messageProcessor = 'pubsub:hubMessageProcessor') {
    this.log = log
    this.config = config
    this.messageProcessor = messageProcessor
  }

  async initialize() {
    // If consumer configs are not present then don't initialize it
    let serviceName = this.config.get('service.name')
    if (!serviceName) {
      return
    }
    // Get the queue name
    let queueName = this.config.get('service.messages.input', `${serviceName}_in`)
    let amqpUrl = this.config.get('service.messages.host')
    // Get the connection. Should we reuse connection?
    let connection = await amqp.connect(amqpUrl)
    // Get the channel
    let channel = await connection.createChannel()
    // Make sure queue exists
    await channel.assertQueue(queueName)
    // set the concurrency
    await channel.prefetch(this.config.get('service.messages.concurrency', 10))
    // start the consumer
    await channel.consume(queueName, async (message) => {
      try {
        // Process message
        await this.messageProcessor.handleProcessing(message)
        // Acknowledge message. General error should be taken care by handler
        // and use mongo to schedule event
        await channel.ack(message)
      } catch (err) {
        // Unacknowledge only in case there is unhandled message
        await channel.nack(message)
      }
    })
  }
}
