const createServiceLoader = require('../lib/services_loader')
const modelsLoader = require('../lib/models_loader')
const initializers = require('../lib/initializers')

module.exports = async function(container, app) {
  await container.run(createServiceLoader(['app', 'plugins']))
  await container.run(modelsLoader)

  const initializers = await container.create(initializers)
  await initializers.run()

  await app.emit('loaded', app)
}
