// this is a simple worker count which will be used to find the total number of active workers
// when clustering is enabled from the metrics. (note this is only 1 because the worker's values
// will be aggregated by the master node)

let workerCount = null

module.exports = (prometheus) => {
  if (workerCount != null) return

  workerCount = new prometheus.Gauge({
    name: `${prometheus.prefix}cluster_workers`,
    help: 'Number of active workers in the cluster'
  })

  workerCount.set(1)
}
