/* eslint-disable no-unused-expressions */
const http = require('http')

describe('Prometheus Service', () => {
  it('exists', async () => {
    const prom = await Q.container.getAsync('prometheus')
    expect(prom).is.not.null
  })

  it('launches webserver', async () => {
    const cluster = await Q.container.getAsync('cluster')
    const prometheus = await Q.container.getAsync('prometheus')

    const body = await new Promise((resolve, reject) => {
      http.get('http://localhost:9230/metrics', (res) => {
        expect(res.statusCode).to.equal(200)
        res.setEncoding('utf8')
        let body = ''
        res.on('data', d => body += d)
        res.on('end', () => resolve(body))
      }).on('error', reject)
    })

    expect(body).to.contain('quadro_process_cpu_user_seconds_total')
  })

  it('launches aggregated server', async function() {
    // have to bypass quadro to construct it again with different options
    const cluster = await Q.container.getAsync('cluster')
    const prometheus = await Q.container.getAsync('prometheus')

    // start clustered server
    prometheus.initialized = false
    prometheus.aggregatorPort = 9231
    cluster.clusteringActive = true
    prometheus.init(cluster)
    cluster.clusteringActive = false

    const body = await new Promise((resolve, reject) => {
      http.get('http://localhost:9231/metrics', (res) => {
        expect(res.statusCode).to.equal(200)
        res.setEncoding('utf8')
        let body = ''
        res.on('data', d => body += d)
        res.on('end', () => resolve(body))
      }).on('error', reject)
    })

    expect(body).to.contain('quadro_process_cpu_user_seconds_total')
  })
})
