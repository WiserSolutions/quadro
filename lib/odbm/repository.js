const Inflector = require('inflected')
const _ = require('lodash')
const assert = require('assert')

module.exports = class Repository {
  constructor(Model, adapter) {
    this.Model = Model
    this.adapter = adapter
    this.naming = this.buildNamingConvention()
    // `collection` in this case defines an abstract collection of items
    // (table, redis list, mongo collection), and is not specific to mongo
    this.dbEntityName = this.entityName(Model.modelName, 'collection')
  }

  async save(model) {
    return model._getAttr('id') ? this.update(model) : this.create(model)
  }

  async update(model) {
    return this.adapter.update(this.dbEntityName, model._getAttr('id'),
      this.changedAttributes(model)
    )
  }

  async create(model) {
    // TODO: Implement server generated ids
    let result = await this.adapter.create(this.dbEntityName,
      this.changedAttributes(model)
    )
    if (result.id && !model._getAttr('id')) model._setAttr('id', result.id)
    assert.ok(model._getAttr('id'), 'Model `id` attribute is expected to be truthy after `create`')
    model.applyChanges()
  }

  changedAttributes(model) {
    return _.transform(model.changes(), (result, { current }, attr) => {
      if (attr === 'id') return
      result[this.entityName(attr, 'field')] = current
    })
  }

  entityName(name, type) {
    switch (this.naming[type]) {
      case 'lower_case': return Inflector.underscore(name)
      case 'lower_case_pluralize': return Inflector.tableize(name)
      default: return Inflector.lower_case(name)
    }
  }

  buildNamingConvention() {
    let result = {}
    let adapterNaming = this.adapter.naming || {}
    result.field = adapterNaming.field || 'lower_case'
    result.collection = adapterNaming.collection = 'lower_case_pluralize'
    return result
  }
}
