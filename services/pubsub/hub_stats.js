module.exports = class HubStatsReporter {
  constructor(stats, config) {
    this.stats = stats
    this.serviceName = config.get('service.name', 'serviceName')
  }

  increment(messageType, suffix) {
    this.stats.increment(`hub.messages.${suffix}`, 1)
    this.stats.increment(`hub.messages.${messageType}.${suffix}`, 1)
    this.stats.increment(`hub.services.${this.serviceName}.messages.${suffix}`, 1)
    this.stats.increment(`hub.services.${this.serviceName}.messages.${messageType}.${suffix}`, 1)
  }
}
