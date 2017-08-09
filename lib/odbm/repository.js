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

  async create(attrs) {
    let model = attrs instanceof this.Model ? attrs : new this.Model(attrs)
    // TODO: Implement server generated ids
    let result = await this.adapter.create(
      this.dbEntityName,
      this.dbInflector.dbFieldsHash(this.modifiedAttributeValues(model))
    )
    if (result.id && !model._getAttr('id')) model._setAttr('id', result.id)
    assert.ok(model._getAttr('id'), 'Model `id` attribute is expected to be truthy after `create`')
    model.applyChanges()
    return model
  }

  async find(query) {
    let dbQuery = this.dbInflector.dbFieldsHash(query)
    let records = await this.adapter.find(this.dbEntityName, dbQuery)
    return Promise.map(records, dbEntity => this.createModelFromDbEntity(dbEntity))
  }

  count(query = {}) {
    let dbQuery = this.dbInflector.dbFieldsHash(query)
    return this.adapter.count(this.dbEntityName, dbQuery)
  }

  async deleteAll() {
    return this.adapter.deleteAll(this.dbEntityName)
  }

  delete(model) {
    let id = model._getAttr('id')
    return this.adapter.delete(this.dbEntityName, id)
  }

  deleteBy(query) {
    let dbQuery = this.dbInflector.dbFieldsHash(query)
    return this.adapter.deleteBy(this.dbEntityName, dbQuery)
  }

  createModelFromDbEntity(entity) {
    let attrs = this.dbInflector.modelAttributesHash(entity)
    return new this.Model(attrs)
  }

  modifiedAttributeValues(model) {
    return _.mapValues(model.changes(), ({ current }) => current)
  }
}
