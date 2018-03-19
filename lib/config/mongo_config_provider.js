const dot = require('dot-object')
const _ = require('lodash')

const DEFAULT_VALUE_ATTR = '_value'

module.exports = class MongoConfigProvider {
  constructor(mongo, collectionName) {
    this.collection = mongo.collection(collectionName)
  }

  initialize() {
    return this.collection.createIndex({id: 1}, {unique: true, name: 'configId'})
  }

  async get(key) {
    const [documentId, path] = this._getDocumentIdAndPath(key)
    const document = await this.collection.findOne({ id: documentId })
    if (document) {
      return path ? dot.pick(path, document) : _.omit(document, '_id', 'id')
    }
    return undefined
  }

  set(key, value) {
    const [documentId, path] = this._getDocumentIdAndPath(key)

    if (!path && typeof value !== 'object') {
      throw new Q.Errors.InvalidOperationError(
        'Mongo config provider does not support atomic values at root level',
        { key, value }
      )
    }

    const modifier = {}
    modifier[path || DEFAULT_VALUE_ATTR] = value

    return this.collection.updateOne(
      { id: documentId },
      { $set: modifier },
      { upsert: true }
    )
  }

  _getDocumentIdAndPath(key) {
    const idDelimiterIndex = key.indexOf('.')
    return idDelimiterIndex === -1 ?
      [key, null] :
      [key.substring(0, idDelimiterIndex), key.substring(idDelimiterIndex + 1)]
  }
}
