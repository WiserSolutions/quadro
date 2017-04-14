require('./promise')

const Errors = require('./errors')
const Container = require('./di/container')
let container = new Container()

global.Q = {
  Errors: new Errors(),
  container
}

container.registerSingleton('app', require('./app'))
container.registerSingleton('config', require('./config/config'))
container.registerSingleton('log', require('./logger'))

process.on('unhandledRejection', function(reason, promise) {
  console.log('Promise rejection unhandled', reason)
})

async function boot() {
  Q.app = await container.getAsync('app')
  Q.config = await container.getAsync('config')
  Q.log = await container.getAsync('log')

  await container.run(require('./services_loader'))
  await container.run(require('./models_loader'))

  if (Q.app.cliParams.watch) return container.create(require('./watcher'))

  let initializers = await container.create(require('./initializers'))
  await initializers.run()

  await Q.app.emit('loaded', Q.app)

  let cmd = Q.app.getAppCommand()
  if (cmd === 'test') return runTests()
  if (cmd === 'task') return runTask()
}

async function runTask() {
  let taskName = Q.app.cliParams._[1]
  if (!taskName) {
    Q.log.error('Task name not specified')
    process.exit(127)
  }
  let taskRunner = await container.getAsync('taskRunner')
  await taskRunner.run(taskName)
}

async function runTests() {
  let testRunner = await container.create(require('./test/test'))
  return testRunner.run()
}

module.exports = async function() {
  await boot()
    .catch(function(err) {
      console.error('App failed')
      console.error(err)
    })
}
