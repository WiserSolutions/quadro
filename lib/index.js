require('./promise')

const EventEmitter = require('./event_emitter')
const Errors = require('./errors/errors')
const Container = require('./di/container')
const Profiler = require('./profiler')
let container = new Container()

const Plugin = require('./plugin')

global.Q = {
  EventEmitter,
  Errors: new Errors(),
  profiler: new Profiler(),
  container
}

container.registerSingleton('app', require('./app'))
container.registerSingleton('config', require('./config/config'))
container.registerSingleton('log', require('./logger/logger'))

process.on('unhandledRejection', function(reason, promise) {
  if (Q.log) {
    Q.log.error({ err: reason }, 'Promise rejection unhandled')
  } else {
    console.log('Promise rejection unhandled', reason)
  }
})

async function boot(opts) {
  opts = opts || {}

  Q.app = await container.getAsync('app')

  Q.plugins = (opts.plugins || []).map(module => new Plugin(module))

  Q.config = await container.getAsync('config')
  Q.config.loadFrom(Q.plugins.map(_ => _.pluginDir))

  Q.log = await container.getAsync('log')

  await container.run(require('./services_loader'))
  await container.run(require('./models_loader'))

  if (Q.app.cliParams.watch) return container.create(require('./watcher'))

  let initializers = await container.create(require('./initializers'))
  await initializers.run()

  await Q.app.emit('loaded', Q.app)

  let cmd = Q.app.getAppCommand()
  if (cmd === 'test') return runTests()
  if (cmd === 'repl') return runREPL()
  if (cmd === 'task') return runTask()
}

function runREPL() {
  require('./repl/repl')
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

module.exports = async function(opts) {
  await boot(opts)
    .catch(function(err) {
      if (Q.log) {
        Q.log.error({ err }, 'App failed')
      } else {
        console.error('App failed')
        console.error(err)
      }
    })
}
