const client = require('prom-client')
const http = require('http')

const aggr = new client.AggregatorRegistry()

module.exports = function(config, cluster) {
  client.prefix = config.get('promethues.prefix', 'quadro_')

  if (!config.get('prometheus.disableDefaultCollection')) {
    client.collectDefaultMetrics({
      timeout: config.get('promotheus.timeout', 15000),
      prefix: client.prefix
    })
  }

  if (cluster.clusteringActive && cluster.isMaster) {
    http.createServer(aggregatedMetricsServerHandler)
      .listen(config.get('prometheus.aggregatorPort', 9230))
  } else if (!cluster.clusteringActive) {
    http.createServer(metricsServerHandler)
      .listen(config.get('prometheus.port', 9230))
  } // else, there is clustering, and this is not the master, so do nothing

  return client
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
