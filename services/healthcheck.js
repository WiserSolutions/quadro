module.exports = class {
  constructor(mongo) {
    this.mongo = mongo
  }

  run() {
    const connectionString = Q.config.get('db.endpoint')
    if (connectionString) {
      return this.mongo.topology.isConnected()
    }
    return true
  }
}
