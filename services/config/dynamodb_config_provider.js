module.exports = function(dynamodb, container) {
  return async function(tableName) {
    let Provider = require('../../lib/config/dynamodb_provider')
    return container.create(Provider, { args: { tableName } })
  }
}
