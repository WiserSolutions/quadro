module.exports = function(externalAPI = 'externalApi:registry', config) {
  Q.externalAPI = externalAPI

  const _ = require('lodash')
  const spec = config.get('external_api', {})
  _.forEach(spec, (apiSpec, name) => Q.externalAPI.register(name, apiSpec))
}
