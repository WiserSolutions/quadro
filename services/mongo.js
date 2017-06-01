module.exports = function(config, app) {
  const { MongoClient } = require('mongodb')
  let dbName = `${app.name}_${app.env}`
  let defaultConnectionUrl = `mongodb://localhost:27017/${dbName}`
  return MongoClient.connect(config.get('db.endpoint', defaultConnectionUrl))
}
