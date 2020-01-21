require('./promise')

const cluster = require('cluster')
const os = require('os')
const http = require('http')
const promClient = require('prom-client')

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

const aggregatorRegistry = new promClient.AggregatorRegistry()

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

function metricsServerHandler(req, res) {
  if (req.method === 'GET' && req.url === '/metrics') {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end(promClient.register.metrics())
  } else {
    res.writeHead(404).end()
  }
}

function aggregatedMetricsServerHandler(req, res) {
  if (req.method === 'GET' && req.url === '/metrics') {
    aggregatorRegistry.clusterMetrics((err, metrics) => {
      if (err) {
        Q.log.warn(err)
        res.writeHead(500, 'Content-Type', 'text/plain')
        res.end(err.message)
      } else {
        res.writeHead(200, 'Content-Type', aggregatorRegistry.contentType)
        res.end(metrics)
      }
    })
  } else {
    res.writeHead(404).end()
  }
}

async function boot(opts) {
  opts = opts || {}

  Q.app = await container.getAsync('app')

  Q.plugins = (opts.plugins || []).map(module => new Plugin(module))

  Q.config = await container.getAsync('config')
  Q.config.loadFrom(Q.plugins.map(_ => _.pluginDir))

  Q.log = await container.getAsync('log')
  const cmd = Q.app.getAppCommand()

  // start workers
  const clustering = (
    Q.config.get('quadro.clustering', false) &&
    ['test', 'repl', 'task'].indexOf(cmd) < 0
  )

  if (cluster.isMaster && clustering) {
    for (let i = 0; i < os.cpus().length; ++i) cluster.fork()
    cluster.on('exit', (worker, code, signal) => {
      Q.log.info(`Worker ${worker.process.pid} exited with code ${code} from signal ${signal}.`)
      process.exit(code)
    })
  }

  // start prometheus server
  if (clustering && cluster.isMaster) {
    http.createServer(aggregatedMetricsServerHandler)
      .listen(Q.config.get('prometheus.aggregatorPort', 9230))
  } else if (!clustering) {
    http.createServer(metricsServerHandler)
      .listen(Q.config.get('prometheus.port', 9230))
  } // else, there is clustering, and this is not the master, so do nothing

  // prevent master from doing work
  if (clustering && cluster.isMaster) return

  await container.run(require('./services_loader'))
  await container.run(require('./models_loader'))

  if (Q.app.cliParams.watch) return container.create(require('./watcher'))

  let initializers = await container.create(require('./initializers'))
  await initializers.run()

  await Q.app.emit('loaded', Q.app)

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
