const _ = require('lodash')
const client = require('prom-client')

// NOTE: the server to make this accessable is located in index's boot sequence
module.exports = class {
  constructor(config) {
    _.extend(this, client)
    this.initialized = false
    this.prefix = config.get('promethues.prefix', 'quadro_')
    this.aggregatorPort = config.get('prometheus.aggregatorPort', 9230)
    this.port = config.get('prometheus.port', 9230)

    if (!config.get('prometheus.disableDefaultCollection')) {
      client.collectDefaultMetrics({
        timeout: config.get('promotheus.timeout', 15000),
        prefix: this.prefix
      })
    }
  }
}
