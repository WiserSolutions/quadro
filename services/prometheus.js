module.exports = function(config, cluster) {
  const client = require('prom-client')
  const http = require('http')

  client.prefix = config.get('promethues.prefix', 'quadro_')

  if (!config.get('prometheus.disableDefaultCollection')) {
    client.collectDefaultMetrics({
      timeout: config.get('promotheus.timeout', 15000),
      prefix: client.prefix
    })
  }

  http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/metrics') {
      res.writeHead(200, { 'Content-Type': 'text/plain' })
      res.end(client.register.metrics())
    } else {
      res.writeHead(404).end()
    }
  }).listen(config.get('prometheus.port', 9230))

  if (cluster.isMaster) {
    const aggr = new client.AggregatorRegistry()

    http.createServer((req, res) => {
      if (req.method === 'GET' && req.url === '/cluster_metrics') {
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
    }).listen(config.get('prometheus.aggregatorPort', 9231))
  }

  return client
}
