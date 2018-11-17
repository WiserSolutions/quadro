function fillInKnownVars(s) {
  return s.replace(/\#\{env\}/, Q.app.env)
}

module.exports = function(config, app, mongoConnectionFactory) {
  const dbName = `${app.name}_${app.env}`
  const defaultConnectionUrl = `mongodb://localhost:27017/${dbName}`
  const connectionString = fillInKnownVars(config.get('db.endpoint', defaultConnectionUrl))
  return mongoConnectionFactory.connectToDB(connectionString)
}
