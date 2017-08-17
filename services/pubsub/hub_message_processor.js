const HubMessageContext = require('./hub_message_context')
const shortid = require('shortid')
const MongoClient = require('mongodb')
const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE

module.exports = class HubMessageProcessor {
  constructor(config, hubStats = 'pubsub:hubStats') {
    this.config = config
    this.hubStats = hubStats
    this.handlers = {}
    this.defaultDelaySec = 5
    this.schedule = [
      5 * SECOND, 3 * MINUTE, 30 * MINUTE, 6 * HOUR
    ]
  }

  /**
   * Initialize the mongo connection
   */
  async initialize() {
    if (this.config.get('service.name')) {
      this.initialized = true
      let mongoClient = await MongoClient.connect(this.config.get('service.storage.host'))
      this.scheduleCollection = await mongoClient.collection(this.config.get('service.storage.schedule'))
      await this.scheduleCollection.createIndex({scheduledMessageId: 1}, {unique: true, name: 'scheduledMessageId'})
      this.deadLetterCollection = await mongoClient.collection(this.config.get('service.storage.dead'))
      await this.deadLetterCollection.createIndex({killedAt: 1}, {name: 'killedAt'})
      await this.deadLetterCollection.createIndex({messageId: 1}, {name: 'messageId'})
    }
  }

  /**
   * This handles the processing of the message. This method does follwoing things
   * 1. Sends message to appropriat handler
   * 2. If message fails then schedule it for later time.
   * 3. If all retries are exhausted then it put the message in dead letter queue
   * @param  {Object}  message the message object
   * @return {Promise}
   */
  async handleProcessing(message) {
    if (!this.initialized) {
      throw new Q.Errors.HubMessageConsumerNotInitializedError()
    }
    // Parse the message
    let parsedMessage = JSON.parse(message.content.toString())
    let messageContext = new HubMessageContext(parsedMessage)
    // Get the message handler based on type
    let handler = this.handlers[parsedMessage.messageType]
    // TODO what to do when there is no handler
    if (!handler) {
      throw new Q.Errors.HubMessageHandlerNotFoundError({messageType: parsedMessage.messageType})
    }
    try {
      await handler.handle(messageContext)
      // reschdule message if it failed
      if (messageContext.isFailed()) await this.rescheduleMessage(messageContext)
      else this.hubStats.increment(parsedMessage.messageType, 'succeeded')
    } catch (err) {
      // In case of error set the retry and push it to mongo
      await this.rescheduleMessage(messageContext)
    }
  }

  /**
   * This method reschedule the message for later time
   * @param  {MessageContext}  messageContext the message context
   * @return {Promise}
   */
  async rescheduleMessage(messageContext) {
    // Get the message from context
    let message = messageContext.getMessage()
    this.hubStats.increment(message.messageType, 'failed')

    // Set the error to message
    if (messageContext.getStatusCode()) {
      messageContext.getMessage().lastError = {
        statusCode: messageContext.getStatusCode(),
        body: messageContext.getError()
      }
    }
    // Set the max attempts if not exists
    if (!message.maxAttempts) message.maxAttempts = 5
    // Set the attempt made
    message.attemptsMade = message.attemptsMade ? message.attemptsMade + 1 : 1
    // If attempt made are more than max attempts
    if (message.attemptsMade >= message.maxAttempts) await this.sendToDeadLetter(message)
    // Else put in the schedule collection
    else await this.scheduleMessage(message)
  }

  /**
   * This method put the message in dead letter collection
   * @param  {Object}  message message object
   * @return {Promise}
   */
  async sendToDeadLetter(message) {
    message.killedAt = Date.now()
    await this.deadLetterCollection.insertOne(message)
    this.hubStats.increment(message.messageType, 'killed')
  }

  /**
   * This method updates the due time of message based on number of retries and
   * put in the scheduled collection of mongo. Central hub then take care of
   * putting it back in exchange at due time
   * @param  {Object}  message message to be rescheduled
   * @return {Promise}         [description]
   */
  async scheduleMessage(message) {
    var dueTime = Date.now() + this.getDelay(message)
    var scheduledItem = {
      dueTime: dueTime,
      message,
      scheduledMessageId: shortid.generate()
    }
    await this.scheduleCollection.insert(scheduledItem)
    this.hubStats.increment(message.messageType, 'scheduled')
  }

  getDelay(msg) {
    return this.schedule[msg.attemptsMade - 1] ||
      this.schedule[this.schedule.length - 1] ||
      this.defaultDelaySec * 1000
  }

  /**
   * This method register a handler with a given message name
   * @param  {String}  messageName the message name
   * @param  {Object}  messageHandler the message handler
   * @return {Promise}
   */
  async register(messageName, messageHandler) {
    this.handlers[messageName] = messageHandler
  }
}

Q.Errors.declareError('HubMessageConsumerNotInitializedError', 'Consumer is not initialized yet')
Q.Errors.declareError('HubMessageHandlerNotFoundError', 'Message handler not found')
