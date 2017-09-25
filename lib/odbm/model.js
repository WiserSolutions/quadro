const Inflector = require('inflected')
const _ = require('lodash')

module.exports = class Model {
  constructor(attrs) {
    this._attrs = {}

    if (!attrs) attrs = {}
    Object.entries(attrs)
      .forEach(([name, value]) => this._setAttr(name, value))
  }

  _setAttr(name, value) {
    // If new attribute - just set the `new` value and return
    if (!this._attrs[name]) {
      this._attrs[name] = { current: value, old: undefined }
      return
    }

    let attr = this._attrs[name]

    // If `old` value already set - just set the current value
    if (attr.hasOwnProperty('old')) {
      return attr.current = value
    }

    if (!didAttrChanged(attr.current, value)) return

    attr.old = attr.current
    attr.current = value
  }

  _getAttr(name) {
    let attr = this._attrs[name]
    if (!attr) return undefined
    return attr.current
  }

  /**
   * isNew - Checks if the model is new
   *
   * @return {Boolean}  true if the model is new, false - otherwise
   */
  isNew() {
    // When no id - we have a new model
    let hasId = this._getAttr('id')
    if (!hasId) return true

    // For non-empty id - it is possible that it is a custom provided Id
    // Check if we have any changed attributes
    let oldId = this._attrs.id.hasOwnProperty('old')
    if (oldId) return true

    return false
  }

  /**
   * isDirty - Checks if the model was changed since last save
   *
   * @return {Boolean}  true - if at least one of the attributes changed since
   * last save, false - otherwise
   */
  isDirty() {
    return _.some(this._attrs, (value) => value.hasOwnProperty('old'))
  }

  serialize() {
    return _.transform(this._attrs, function(acc, value, key) {
      acc[key] = _.cloneDeep(value.current)
    }, {})
  }

  changes() {
    return _.transform(this._attrs, function(acc, value, key) {
      if (!value.hasOwnProperty('old')) return
      let { current, old } = value
      acc[key] = { current: _.cloneDeep(current), old: _.cloneDeep(old) }
    })
  }

  applyChanges() {
    _.forEach(this._attrs, attr => delete attr.old)
  }

  static build(attrs) {
    let Klass = this
    return new Klass(attrs)
  }

  static createModelClass(name, spec) {
    if (!spec) spec = {}
    if (!spec.attributes) spec.attributes = {}
    if (!spec.attributes.id) spec.attributes.id = { type: 'object', readonly: true }

    const klassName = Inflector.classify(name)
    Q.log.trace({ klassName }, 'Creating model class')
    /* eslint no-eval: 0 */
    let Klass = eval(`(function() { var model = class ${klassName} extends Model {}; return model})()`)
    Klass.modelName = name
    Klass.modelSpec = spec
    return Klass
  }
}

function didAttrChanged(currentValue, newValue) {
  if (currentValue && !newValue) return true
  if (!currentValue && newValue) return true

  if (typeof newValue !== typeof currentValue) return true

  let type = typeof currentValue
  if (['string', 'number'].includes(type)) return currentValue !== newValue

  return true
}
