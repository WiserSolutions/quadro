const cluster = require('cluster')
const promClient = require('prom-client')
const http = require('http')
const os = require('os')

const aggregatorRegistry = new promClient.AggregatorRegistry()

function clusteringActive() {
  return (
    Q.config.get('quadro.clustering', false) &&
    ['test', 'repl', 'task'].indexOf(Q.app.getAppCommand()) < 0 &&
    os.cpus().length > 1
  )
}

function spawnWorkers(settings = {}) {
  if (!cluster.isMaster) return

  cluster.setupMaster(settings)
  for (let i = 0; i < os.cpus().length; ++i) {
    cluster.fork()
  }

  cluster.on('exit', (worker, code, signal) => {
    Q.log.info(`Worker ${worker.process.pid} exited with code ${code} from signal ${signal}.`)
    process.exit(code)
  })
}

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

function startPromServer(clustering) {
  // start prometheus server
  if (clustering && cluster.isMaster) {
    return http.createServer(aggregatedMetricsServerHandler)
      .listen(Q.config.get('prometheus.aggregatorPort', 9230))
  } else if (!clustering) {
    return http.createServer(metricsServerHandler)
      .listen(Q.config.get('prometheus.port', 9230))
  } // else, there is clustering, and this is not the master, so do nothing
}

function init() {
  const clustering = clusteringActive()

  if (clustering) spawnWorkers()
  startPromServer(clustering)

  // return true if further init should be halted
  // only applies to master when clustering is active
  return clustering && cluster.isMaster
}

module.exports = {
  aggregatorRegistry,
  clusteringActive,
  spawnWorkers,
  metricsServerHandler,
  aggregatedMetricsServerHandler,
  startPromServer,
  init
}
