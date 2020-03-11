const APIWrapper = require('../../lib/external_api/api_wrapper')

module.exports = class ExternalAPIRegistry {
  constructor(prometheus) {
    this.metrics = {
      duration: new prometheus.Histogram({
        name: `${prometheus.prefix}extapi_duration`,
        help: 'How long individual external api calls take to complete.',
        labelNames: ['api']
      }),
      sentiment: new prometheus.Counter({
        name: `${prometheus.prefix}extapi_sentiment`,
        help: 'Number of errors being encountered while trying to run jobs.',
        labelNames: ['sentiment', 'api']
      }),
      retries: new prometheus.Counter({
        name: `${prometheus.prefix}extapi_retry_count`,
        help: 'Number of retries executed.',
        labelNames: ['api']
      })
    }
  }

  register(name, apiSpec) {
    const api = new APIWrapper(name, apiSpec, this.metrics)
    this[name] = api
    return api
  }
}
