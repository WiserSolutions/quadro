const assert = require('assert')
const _ = require('lodash')

const INSTANCE_METHODS = ['save', 'update', 'delete']
const STATIC_METHODS = ['create', 'find', 'get', 'deleteAll', 'deleteBy', 'count']

function addStaticMethods(Model) {
  STATIC_METHODS.forEach(function(method) {
    Model[method] = async function(...args) {
      let repo = await Model.repository
      return repo[method](...args)
    }
  })
}

function addInstanceMethods(Model) {
  INSTANCE_METHODS.forEach(function(method) {
    Model.prototype[method] = async function(...args) {
      let repo = await Model.repository
      return repo[method](this, ...args)
    }
  })
}

function addAttributeAccessors(Model) {
  let spec = Model.modelSpec
  assert(spec, 'modelSpec is not set on model' + Model)

  let attributes = spec.attributes || {}
  _.forEach(attributes, function(descriptor, name) {
    if (typeof descriptor === 'string') descriptor = { type: descriptor }
    let options = {
      get: function() {
        return this._getAttr(name)
      }
    }
    if (!descriptor.readonly) {
      options.set = function(value) {
        this._setAttr(name, value)
      }
    }
    Object.defineProperty(Model.prototype, name, options)
  })
}

module.exports = {
  apply(Model) {
    addStaticMethods(Model)
    addInstanceMethods(Model)
    addAttributeAccessors(Model)
  }
}
