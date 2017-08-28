module.exports = class HubStatsReporter {
  constructor(stats, config) {
    this.stats = stats
    this.serviceName = config.get('service.name', 'serviceName')
  }

  increment(messageType, suffix, failureCode) {
    let tags = { messageType: messageType, subscriber: this.serviceName }
    if (failureCode) {
      tags.failureCode = failureCode
    }
    this.stats.increment(`hub.messages.${suffix}`, 1, tags)
  }

  timing(messageType, suffix, timer) {
    let tags = { messageType: messageType, subscriber: this.serviceName }
    this.stats.timing(`hub.messages.${suffix}`, timer, tags)
  }
}
