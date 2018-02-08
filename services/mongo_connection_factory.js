const URL = require('url')
const MongoConnectionError = Q.Errors.declareError('MongoConnectionError')

module.exports = class {
  createClient(connectionString, ignoreDB = false) {
    const { MongoClient } = require('mongodb')

    const url = URL.parse(connectionString)
    if (url.path && !ignoreDB) {
      throw new MongoConnectionError(
        `Calling 'createClient' on a mongo database url (mongodb://host/db_name).
        You probably want to call 'connectToDB' instead.
        'createClient' expects only mongo server url as mongodb://host.
        `
      )
    }

    return MongoClient.connect(connectionString)
  }

  async connectToDB(connectionString) {
    const url = URL.parse(connectionString)
    if (!url.path) {
      throw new MongoConnectionError(
        `Calling 'connectToDB' without specifying a db name (e.g. mongodb://host).break
        You probably want to call 'createClient' instead.
        'connectToDB' expects a database name to be specified as in: mongodb://host/db.
        `
      )
    }

    const client = await this.createClient(connectionString, true)
    return client.db(url.path.replace(/^\//, ''))
  }
}
