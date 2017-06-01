const INSTANCE_METHODS = ['save', 'update', 'delete']

const STATIC_METHODS = ['create', 'find', 'get', 'deleteAll']

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
      return repo[method](...args)
    }
  })
}

module.exports = {
  apply(Model) {
    addStaticMethods(Model)
    addInstanceMethods(Model)
  }
}
