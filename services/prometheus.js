module.exports = function(config) {
  const client = require('prom-client')

  if (!config.get('prometheus.disableDefaultCollection')) {
    client.collectDefaultMetrics({
      timeout: config.get('promotheus.timeout', 15000),
      prefix: config.get('promethues.prefix', 'quadro_')
    })
  }

  return client
}
