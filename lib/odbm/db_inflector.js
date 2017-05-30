const Inflector = require('inflected')
const _ = require('lodash')

module.exports = class {
  constructor(naming) {
    this.naming = {
      field: 'lower_case',
      collection: 'lower_case_pluralize',
      attribute: 'camel'
    }
  }

  collectionName(collection) {
    return this.convertName(collection, this.naming.collection)
  }

  fieldName(field) {
    return this.convertName(field, this.naming.field)
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
    return this.convertName(dbFieldName, this.naming.attribute)
  }

  convertName(name, format) {
    switch (format) {
      case 'lower_case': return Inflector.underscore(name)
      case 'lower_case_pluralize': return Inflector.tableize(name)
      default: return Inflector.camelize(name, false)
    }
  }
}
