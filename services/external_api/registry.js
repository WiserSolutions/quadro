const APIWrapper = require('../../lib/external_api/api_wrapper')

module.exports = class ExternalAPIRegistry {
  constructor(stats) {
    this.stats = stats
  }

  register(name, apiSpec) {
    const api = new APIWrapper(name, apiSpec, this.stats)
    this[name] = api
    return api
  }
}
