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
    let Klass = eval(`class ${klassName} extends Model {}`)
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
