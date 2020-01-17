const _ = require('lodash')
const client = require('prom-client')
const http = require('http')

const aggr = new client.AggregatorRegistry()

module.exports = class {
  constructor(config) {
    _.extend(this, client)
    this.initialized = false
    this.prefix = config.get('promethues.prefix', 'quadro_')
    this.aggregatorPort = config.get('prometheus.aggregatorPort', 9230)
    this.port = config.get('prometheus.port', 9230)

    if (!config.get('prometheus.disableDefaultCollection')) {
      client.collectDefaultMetrics({
        timeout: config.get('promotheus.timeout', 15000),
        prefix: this.prefix
      })
    }
  }

  init(cluster) {
    if (this.initialized) return
    if (cluster.clusteringActive && cluster.isMaster) {
      http.createServer(aggregatedMetricsServerHandler)
        .listen(this.aggregatorPort)
    } else if (!cluster.clusteringActive) {
      http.createServer(metricsServerHandler)
        .listen(this.port)
    } // else, there is clustering, and this is not the master, so do nothing
    this.initialized = true
  }
}

function metricsServerHandler(req, res) {
  if (req.method === 'GET' && req.url === '/metrics') {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end(client.register.metrics())
  } else {
    res.writeHead(404).end()
  }
}

function aggregatedMetricsServerHandler(req, res) {
  if (req.method === 'GET' && req.url === '/metrics') {
    aggr.clusterMetrics((err, metrics) => {
      if (err) {
        Q.log.warn(err)
        res.writeHead(500, 'Content-Type', 'text/plain')
        res.end(err.message)
      } else {
        res.writeHead(200, 'Content-Type', aggr.contentType)
        res.end(metrics)
      }
    })
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end(client.register.metrics())
  } else {
    res.writeHead(404).end()
  }
}
