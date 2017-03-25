require('./promise')

const App = require('./app')
const Container = require('./di/container')
const Logger = require('./logger')
const Config = require('./config')

global.Q = {}

process.on('unhandledRejection', function(reason, promise) {
  console.log('Promise rejection unhandled', reason)
})

async function boot() {
  let container = new Container()

  container.register('container', container)
  Q.container = await container.getAsync('container')

  container.registerSingleton('app', App)
  Q.app = await container.getAsync('app')

  container.registerSingleton('config', Config)
  Q.config = await container.getAsync('config')

  container.registerSingleton('log', Logger)
  Q.log = await container.getAsync('log')

  await container.run(require('./services_loader'))

  if (Q.app.cliParams.watch) await container.create(require('./watcher'))

  let initializers = await container.create(require('./initializers'))
  await initializers.run()

  await Q.app.emit('loaded', Q.app)

  let cmd = (Q.app.cliParams._ && Q.app.cliParams._[0]) || 'run'
  if (cmd === 'test') {
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
