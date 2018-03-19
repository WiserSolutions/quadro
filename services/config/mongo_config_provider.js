module.exports = function(mongo, container) {
  return function(collectionName) {
    const Provider = require('../../lib/config/mongo_config_provider')
    return container.create(Provider, { args: { collectionName }})
  }
}
