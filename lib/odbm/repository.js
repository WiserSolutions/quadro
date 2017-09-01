const _ = require('lodash')
const assert = require('assert')
const DBInflector = require('./db_inflector')

module.exports = class Repository {
  constructor(Model, adapter) {
    this.Model = Model
    this.adapter = adapter
    this.dbInflector = new DBInflector(this.adapter.naming)
    // `collection` in this case defines an abstract collection of items
    // (table, redis list, mongo collection), and is not specific to mongo
    this.dbEntityName = this.dbInflector.collectionName(Model.modelName)
  }

  async get(id) {
    let record = await this.adapter.get(this.dbEntityName, id)
    return this.createModelFromDbEntity(record)
  }

  save(model) {
    if (model._getAttr('id')) return this.update(model)
    return this.create(model)
  }

  update(model) {
    let modifiedAttrs = this.modifiedAttributeValues(model)
    return this.adapter.update(
      this.dbEntityName, model._getAttr('id'),
      this.dbInflector.dbFieldsHash(_.omit(modifiedAttrs, 'id'))
    )
  }

  async create(toInsert) {
    if (!_.isArray(toInsert)) toInsert = [toInsert]
    let manyInsertArray = []
    let models = []
    for (let attrs of toInsert) {
      let model = attrs instanceof this.Model ? attrs : new this.Model(attrs)
      models.push(model)
      manyInsertArray.push(this.dbInflector.dbFieldsHash(this.modifiedAttributeValues(model)))
    }

    let results = await this.adapter.create(
      this.dbEntityName,
      manyInsertArray
    )

    let returnValues = []
    for (var i = 0; i < models.length; i++) {
      let model = models[i]
      let result = results[i]
      if (result.id && !model._getAttr('id')) model._setAttr('id', result.id)
      model.applyChanges()
      returnValues.push(model)
    }

    if (returnValues.length === 1) return returnValues[0]
    return returnValues
  }

  async find(query) {
    Q.log.trace({ query, model: this.Model.name }, 'find')
    let dbQuery = this.dbInflector.dbFieldsHash(query)
    let records = await this.adapter.find(this.dbEntityName, dbQuery)
    return Promise.map(records, dbEntity => this.createModelFromDbEntity(dbEntity))
  }

  async findOrBuild(query) {
    let models = await this.find(query)
    if (models.length > 1) throw new Q.Errors.AtMostOneRecordExpected({ query })
    if (models.length === 0) return new this.Model(query)
    return models[0]
  }

  async findOne(query) {
    let result = await this.find(query)
    if (result.length === 0) throw new Q.Errors.RecordNotFound({ query })
    if (result.length > 1) throw new Q.Errors.OnlyOneRecordExpected({ query })
    return result[0]
  }

  count(query = {}) {
    let dbQuery = this.dbInflector.dbFieldsHash(query)
    return this.adapter.count(this.dbEntityName, dbQuery)
  }

  async deleteAll(query = {}) {
    let dbQuery = this.dbInflector.dbFieldsHash(query)
    return this.adapter.deleteAll(this.dbEntityName, dbQuery)
  }

  delete(model) {
    let id = model._getAttr('id')
    return this.adapter.delete(this.dbEntityName, id)
  }

  createModelFromDbEntity(entity) {
    let attrs = this.dbInflector.modelAttributesHash(entity)
    return new this.Model(attrs)
  }

  modifiedAttributeValues(model) {
    return _.mapValues(model.changes(), ({ current }) => current)
  }
}
