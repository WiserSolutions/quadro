const path = require('path')

async function runInitializers(app, container, log) {
  let dirs = [path.join(app.quadroDir, 'lib'), app.appDir]
  let files = app.glob('test/initializers/*.js', { dirs })
  return Promise.map(files, _ => container.create(require(_)))
}

before(async function() {
  let container = global.container

  global.nock = require('nock')
  global.pubsub = await container.getAsync('pubsub')

  await container.create(runInitializers)
})
