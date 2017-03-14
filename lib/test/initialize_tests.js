const path = require('path')

async function runInitializers(app, container, log) {
  let dirs = [path.join(app.quadroDir, 'lib'), app.appDir]
  let files = await app.glob('test/initializers/*.js', { dirs })
  await files.map(async _ => await container.create(require(_)))
}

before(async function() {
  let container = global.container

  global.config = await container.getAsync('config')
  global.log = await container.getAsync('log')
  global.app = await container.getAsync('app')
  global.nock = require('nock')
  global.pubsub = await container.getAsync('pubsub')

  await container.create(runInitializers)
})
