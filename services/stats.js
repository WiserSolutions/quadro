const StatsdClient = require('statsd-client')

module.exports = function(config) {
  return new StatsdClient({
    host: config.get('quadro.statsd.host'),
    port: config.get('quadro.statsd.port'),
    tcp: config.get('quadro.statsd.protocol') === 'tcp'
  })
}
