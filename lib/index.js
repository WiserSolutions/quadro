require('./promise')

const App = require('./app')
const Container = require('./di/container')
const Logger = require('./logger')
const Paths = require('./paths')
const Config = require('./config')

process.on('unhandledRejection', function(reason, promise) {
  console.log('Promise rejection unhandled', reason)
})

async function boot() {
  let container = new Container()

  container.register('container', container)
  container.registerSingleton('app', App)
  container.registerSingleton('config', Config)
  container.registerSingleton('log', Logger)

  let app = await container.getAsync('app')

  if (app.cliParams.watch) await container.create(require('./watcher'))

  let initializers = await container.create(require('./initializers'))
  await initializers.run()

  let cmd = app.cliParams._ && app.cliParams._[0] || 'run'
  if (cmd === 'test') {
    global.config = await container.getAsync('config')
    global.log = await container.getAsync('log')
    global.app = app

    let testRunner = await container.create(require('./test/test'))
    return await testRunner.run()
  }
}

module.exports = async function() {
  await boot()
    .catch(function(err) {
      console.error('App failed')
      console.error(err)
    })
}
