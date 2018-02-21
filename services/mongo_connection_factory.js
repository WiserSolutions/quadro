
const mongoUri = require('mongodb-uri')
const MongoConnectionError = Q.Errors.declare('MongoConnectionError')

module.exports = class {
  _parseConnectionString(connectionString) {
    let { database, ...rest } = mongoUri.parse(connectionString)
    const result = { connectionString: mongoUri.format(rest) }
    if (database) result.dbName = database
    return result
  }

  async createClient(connectionString, ignoreDB = false) {
    const { MongoClient } = require('mongodb')

    const connection = this._parseConnectionString(connectionString)
    if (connection.dbName && !ignoreDB) {
      throw new MongoConnectionError(
        `Calling 'createClient' on a mongo database url (mongodb://host/db_name).
        You probably want to call 'connectToDB' instead.
        'createClient' expects only mongo server url as mongodb://host.
        `
      )
    }

    const options = { promiseLibrary: require('bluebird') }

    return MongoClient.connect(connectionString, options)
  }

  async connectToDB(connectionString) {
    const connection = this._parseConnectionString(connectionString)
    if (!connection.dbName) {
      throw new MongoConnectionError(
        `Calling 'connectToDB' without specifying a db name (e.g. mongodb://host).break
        You probably want to call 'createClient' instead.
        'connectToDB' expects a database name to be specified as in: mongodb://host/db.
        `
      )
    }

    const client = await this.createClient(connection.connectionString, true)
    return client.db(connection.dbName)
  }
}
