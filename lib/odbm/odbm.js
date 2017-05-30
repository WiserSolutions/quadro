module.exports = async function odbm(container, log) {
  const Model = require('./model')
  Q.Repository = require('./repository')

  Q.Model = function(name, spec, options) {
    log.trace({ name }, 'Registering model')
    let klass = Model.createModelClass(name, spec)
    return klass
  }

  Q.Model.Class = Model
}
