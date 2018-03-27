module.exports = class {
  constructor(mongo) {
    this.mongo = mongo
  }

  run() {
    return this.mongo.topology.isConnected()
  }
}
