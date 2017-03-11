const path = require('path')
const bluebird = require('bluebird')
const glob = bluebird.promisify(require('glob'))

async function runInitializers(app, container, log) {
  let files = (await glob('test/initializers/*.js'))
    .map(_ => path.resolve(app.appDir, _))
    .concat(await glob(path.join(__dirname, './initializers/*.js')))
  log.debug({ files }, 'Loading test initializers')
  await files.map(async _ => await container.create(require(_)))
}

before(async function() {
  await global.container.create(runInitializers)
})
