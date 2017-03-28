const _ = require('lodash')

module.exports = async function(app, container) {
  Q.Models = {}
  container.register('models', Q.Models)

  await Promise.map(
    app.glob('models/*.js', { verbose: true }),
    loadModel
  )
}

async function loadModel(file) {
  let model = require(file.absolutePath)
  let modelName = _.camelCase(file.relativePath.replace(/^models\/|\.js/g, ''))
  Q.Models[modelName] = model
}
