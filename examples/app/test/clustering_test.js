/* eslint-disable no-unused-expressions */
const clustering = require('../../../lib/clustering.js')
const cluster = require('cluster')
const os = require('os')
const http = require('http')

describe('Clustering', () => {
  const sandbox = require('sinon').createSandbox()

  afterEach(() => sandbox.restore())

  it('detects if clustering is active', function() {
    expect(clustering.clusteringActive()).to.be.false
    sandbox.stub(os, 'cpus').returns(['one', 'two'])

    this.sinon.stub(Q.config, 'get').withArgs('quadro.clustering', false).returns(true)
    expect(clustering.clusteringActive()).to.be.false
    this.sinon.stub(Q.app, 'getAppCommand').returns('run')
    expect(clustering.clusteringActive()).to.be.true
    Q.config.get.restore()
    expect(clustering.clusteringActive()).to.be.false
    Q.app.getAppCommand.restore()
  })

  it('spawns workers', function() {
    sandbox.stub(os, 'cpus').returns(['onecpu', 'twocpu'])
    const fork = sandbox.stub(cluster, 'fork')

    clustering.spawnWorkers()
    expect(fork).to.have.been.calledTwice
  })

  it('Handles non-clustered metrics requests', async () => {
    sandbox.stub(Q.config, 'get').withArgs('prometheus.port', 9230).returns(9235)
    const server = clustering.startPromServer(false)

    const body = await new Promise((resolve, reject) => {
      http.get('http://localhost:9235/metrics', (res) => {
        expect(res.statusCode).to.equal(200)
        res.setEncoding('utf8')
        let body = ''
        res.on('data', d => body += d)
        res.on('end', () => resolve(body))
      }).on('error', reject)
    })
    expect(body).to.contain('quadro_process_cpu_user_seconds_total')

    await new Promise((resolve, reject) => {
      http.get('http://localhost:9235/randomUrl', (res) => {
        expect(res.statusCode).to.equal(404)
        resolve()
      }).on('error', reject)
    })
    server.close()
  })

  it('Handles clustered metrics requests', async () => {
    sandbox.stub(Q.config, 'get').withArgs('prometheus.aggregatorPort', 9230).returns(9236)
    const server = clustering.startPromServer(true)
    // todo: use sinon.replace when supported
    const oldfn = clustering.aggregatorRegistry.clusterMetrics

    // can't verify body because it will be empty without workers
    clustering.aggregatorRegistry.clusterMetrics = fn => {
      fn(null, 'metrics')
    }
    const body = await new Promise((resolve, reject) => {
      http.get('http://localhost:9236/metrics', (res) => {
        expect(res.statusCode).to.equal(200)
        res.setEncoding('utf8')
        let body = ''
        res.on('data', d => body += d)
        res.on('end', () => resolve(body))
      }).on('error', reject)
    })
    expect(body).to.equal('metrics')

    await new Promise((resolve, reject) => {
      http.get('http://localhost:9236/randomUrl', (res) => {
        expect(res.statusCode).to.equal(404)
        resolve()
      }).on('error', reject)
    })

    clustering.aggregatorRegistry.clusterMetrics = fn => {
      fn('ERR!')
    }
    await new Promise((resolve, reject) => {
      http.get('http://localhost:9236/metrics', (res) => {
        expect(res.statusCode).to.equal(500)
        resolve()
      }).on('error', reject)
    })
    clustering.aggregatorRegistry.clusterMetrics = oldfn

    server.close()
  })
})
