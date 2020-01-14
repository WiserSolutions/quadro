module.exports = class HubStatsReporter {
  /**
   * @deprecated Will be removed in a future version.
   */
  constructor(stats, config) {
    this.stats = stats
    this.serviceName = config.get('service.name', 'serviceName')
  }

  /**
   * @deprecated Will be removed in a future version.
   */
  increment(messageType, suffix, failureCode) {
    console.warn('Hub stats is deprecated and will be removed in a future version.')
    let tags = { messageType: messageType, subscriber: this.serviceName }
    if (failureCode) {
      tags.failureCode = failureCode
    }
    this.stats.increment(`hub.messages.${suffix}`, 1, tags)
  }

  /**
   * @deprecated Will be removed in a future version.
   */
  timing(messageType, suffix, timer) {
    console.warn('Hub stats is deprecated and will be removed in a future version.')
    let tags = { messageType: messageType, subscriber: this.serviceName }
    this.stats.timing(`hub.messages.${suffix}`, timer, tags)
  }
}
