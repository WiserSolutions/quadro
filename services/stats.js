const StatsdClient = require('statsd-client')

module.exports = function(config, app) {
  return new StatsdClient({
    host: config.get('quadro.statsd.host'),
    port: config.get('quadro.statsd.port', 8125),
    tcp: config.get('quadro.statsd.protocol') === 'tcp',
    prefix: config.get('quadro.statsd.prefix', app.name),
    tags: config.get('quadro.statsd.tags', {})
  })
}
