const cluster = require('cluster')
const os = require('os')

// ensure multiple instance of this consturcted on the master does not create extra workers
let initlized = false

module.exports = class {
  // only a single instance should be consturcted.
  constructor(config, log) {
    this.config = config
    this.numCPUs = os.cpus().length
    this.clusteringActive = this.config.get('quadro.clustering', false)
    this.isMaster = cluster.isMaster

    // don't actually start up the cluster
    if (!this.clusteringActive) return

    if (this.isMaster) {
      if (initlized) return
      initlized = true
      log.debug(`Master ${process.pid} initlizing workers.`)
      // start numCPUs - 1 workers.
      for (let i = 0; i < this.numCPUs - 1; ++i) cluster.fork()
      cluster.on('exit', (worker, code, signal) => {
        log.info(`Worker ${worker.process.pid} exited with code ${code} from signal ${signal}.`)
      })
    } else {
      log.info(`Worker ${process.pid} started.`)
    }
  }
}
