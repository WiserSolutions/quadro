const APIWrapper = require('./api_wrapper')

module.exports = class ExternalAPIRegistry {
  register(name, apiSpec) {
    const api = new APIWrapper(apiSpec)
    this[name] = api
    return api
  }
}
