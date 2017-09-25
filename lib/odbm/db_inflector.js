const Inflector = require('inflected')
const _ = require('lodash')

module.exports = class {
  constructor(naming, modelClass) {
    this.modelClass = modelClass
    this.modelSpec = modelClass.modelSpec || {}
    this.modelAttrsSpec = this.modelSpec.attributes || {}
    this.naming = {
      field: 'lower_case',
      collection: 'lower_case_pluralize',
      attribute: 'camel'
    }
  }

  collectionName(collection) {
    return this.convertName(collection, this.naming.collection)
  }

  fieldName(attr) {
    let attrSpec = this.modelAttrsSpec[attr]
    if (attrSpec && attrSpec.physicalName) return attrSpec.physicalName
    return this.convertName(attr, this.naming.field)
  }

  dbFieldsHash(attributes) {
    return _.transform(attributes || {}, (result, value, key) => {
      result[this.fieldName(key)] = value
    })
  }

  modelAttributesHash(dbRecord) {
    return _.transform(dbRecord || {}, (result, value, key) => {
      result[this.attributeName(key)] = value
    })
  }

  attributeName(dbFieldName) {
    let attrName = _.findKey(this.modelAttrsSpec, as => as && as.physicalName === dbFieldName)
    if (attrName) return attrName

    return this.convertName(dbFieldName, this.naming.attribute)
  }

  convertName(name, format) {
    name = name.replace(/(^[_.]*)/g, '')
    switch (format) {
      case 'lower_case': return Inflector.underscore(name)
      case 'lower_case_pluralize': return Inflector.tableize(name)
      default: return Inflector.camelize(name, false)
    }
  }
}
