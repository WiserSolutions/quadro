module.exports = function(config, app, mongoConnectionFactory, prometheus) {
  const dbName = `${app.name}_${app.env}`
  const defaultConnectionUrl = `mongodb://localhost:27017/${dbName}`
  const connectionString = config.get('db.endpoint', defaultConnectionUrl)
  const db = mongoConnectionFactory.connectToDB(connectionString)

  const query_count = prometheus.Counter({
    name: 'mongodb_query_count',
    help: 'Total number of mongodb queries.',
    labelNames: ['caller', 'callee']
  })

  const query_time = prometheus.Histogram({
    name: 'mongodb_query_time',
    help: 'Time taken by mongodb queries.',
    labelnames: ['caller', 'callee']
  })
  
  // wrap the db connection with metrics logic
  // first wrap the collection "constructor" to wrap new collections with metrics logic
  const getCollection = db.collection
  db.collection = function metricsCollectionWrapper() {
    const collection = getCollection(...arguments)
    // wrap all of the new collection's methods
    for (k in collection) {
      if (typeof k != 'function') continue
      const fn = collection[k]
      collection[k] = function metricsWrapper() {
        const caller = metricsWrapper.caller()
        const callee = k

        const startTime = new Date()
        query_count.labels(caller, callee).inc(1, startTime)

        // run wrapped function
        let result
        try {
          result = fn(...arguments)
        } catch (e) {
          throw e
        }

        // time the operation
        if ('then' in result) {
          // result is a promise
          result.then(() => {
            const endTime = new Date()
            query_time.labels(caller, callee).observe((endTime - startTime) / 1000)
          })
        } else {
          // result is not a promise
          const endTime = new Date()
          query_time.labels(caller, callee).observe((endTime - startTime) / 1000)
        }

        return result
      }
    }
    return collection
  }
  return db
}