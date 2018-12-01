const StatsdClient = require('statsd-client')

module.exports = function(config, app) {
  function buildDefaultTags() {
    const tags = {}

    const envId = config.get('env.id')
    if (envId) tags.env_id = envId

    const env = process.env.STAGE || app.env
    if (env) tags.env = env

    const service = app.name
    if (service) tags.service = service

    return tags
  }

  return new StatsdClient({
    host: config.get('quadro.statsd.host'),
    port: config.get('quadro.statsd.port', 8125),
    tcp: config.get('quadro.statsd.protocol') === 'tcp',
    prefix: config.get('quadro.statsd.prefix', ''),
    tags: config.get('quadro.statsd.tags', buildDefaultTags())
  })
}
