const cluster = require('cluster')
const os = require('os')

// ensure multiple instance of this consturcted on the master does not create extra workers
let initlized = false

module.exports = class {
  // only a single instance should be consturcted.
  constructor(app, config) {
    this.config = config
    this.numCPUs = os.cpus().length
    this.clusteringActive = (
      ['task', 'test', 'repl'].indexOf(app.getAppCommand()) < 0 &&
      this.config.get('quadro.clustering', false)
    )
    this.isMaster = cluster.isMaster
    this.workers = []

    // go ahead and start things up
    if (this.clusteringActive) this._init()
  }

  _init() {
    if (!this.isMaster) {
      Q.log.info(`Worker ${process.pid} started.`)
      return
    }

    if (initlized) return
    initlized = true

    Q.log.debug(`Master ${process.pid} initlizing workers.`)
    // start numCPUs - 1 workers.
    for (let i = 0; i < this.numCPUs - 1; ++i) {
      this.workers.push(cluster.fork())
    }

    cluster.on('exit', (worker, code, signal) => {
      Q.log.info(`Worker ${worker.process.pid} exited with code ${code} from signal ${signal}.`)
      this.shutdown(1)
    })
    process.on('SIGINT', () => this.shutdown())
    process.on('SIGTERM', () => this.shutdown())
  }

  shutdown(code = 0) {
    for (const w of this.workers) {
      if (w.isDead()) continue
      try {
        w.process.kill('SIGKILL')
      } catch (err) {
        Q.log.error(err, 'Error killing worker!')
      }
    }

    process.exit(code)
  }
}
