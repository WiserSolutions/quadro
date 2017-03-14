const StatsdClient = require('statsd-client')

module.exports = function(config, container) {
  let client = new StatsdClient({
    host: config.get('quadro.statsd.host'),
    port: config.get('quadro.statsd.port'),
    tcp: config.get('quadro.statsd.protocol') === 'tcp'
  })
  container.registerSingleton('stats', client)
}
