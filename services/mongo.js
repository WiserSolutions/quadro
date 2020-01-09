module.exports = function(config, app, mongoConnectionFactory, prometheus) {
  const dbName = `${app.name}_${app.env}`
  const defaultConnectionUrl = `mongodb://localhost:27017/${dbName}`
  const connectionString = config.get('db.endpoint', defaultConnectionUrl)
  const db = mongoConnectionFactory.connectToDB(connectionString)

  const labelNames = ['function', 'operation']
  const metrics = {
    queryCount: prometheus.Counter({
      name: 'mongodb_query_count',
      help: 'Total number of mongodb queries.',
      labelNames
    }),
    errorCount: prometheus.Counter({
      name: 'mongodb_query_errors',
      help: 'Number of failed mongodb queries.',
      labelNames
    }),
    successCount: prometheus.Counter({
      name: 'mongodb_query_successes',
      help: 'Number of successful mongodb queries.',
      labelNames
    }),
    queryTime: prometheus.Histogram({
      name: 'mongodb_query_time',
      help: 'Time taken by mongodb queries.',
      labelnames
    })
  }
  
  // wrap the db connection with metrics logic
  db.collection = metricsConstructorWrapper(db.collection, metrics)
  db.db = metricsConstructorWrapper(db.db, metrics)
  return db
}

function metricsConstructorWrapper(constructor, metrics) {
  return function metricsObjectWrapper() {
    const obj = constructor(...arguments)
    // wrap all of the new obj's methods
    for (k in obj) {
      if (typeof k != 'function') continue
      const fn = obj[k]
      obj[k] = function metricsWrapper() {
        // labels for all metrics
        const labels = {
          function: metricsWrapper.caller().name,
          operation: k  // mongo api function name
        }

        const startTime = new Date()

        // couple helper lambdas for reporting
        const recordSuccess = () => {
          const endTime = new Date()
          metrics.queryTime.observe(labels, (endTime - startTime) / 1000)
          metrics.successCount.inc(labels, 1)
        }
        const recordFailure = () => {
          metrics.errorCount.inc(labels, 1)
        }

        metrics.queryCount.inc(labels, 1)

        // run wrapped function
        let result
        try {
          result = fn(...arguments)
        } catch (e) {
          // count errors for non-promises
          recordFailure()
          throw e
        }
        
        // record completion and return
        if ('then' in result)  // result is a promise
          result.then(recordSuccess).catch(recordFailure)
        else
          recordSuccess()
        return result
      }
    }
    return collection
  }
}
