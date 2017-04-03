module.exports = function(dynamodb) {
  return async function(tableName) {
    let Provider = require('../lib/config/dynamodb_provider')
    let provider = new Provider(dynamodb, tableName)
    await provider.initialize()
    return provider
  }
}
