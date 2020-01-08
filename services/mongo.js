module.exports = function(config, app, mongoConnectionFactory, prometheus) {
  const dbName = `${app.name}_${app.env}`
  const defaultConnectionUrl = `mongodb://localhost:27017/${dbName}`
  const connectionString = config.get('db.endpoint', defaultConnectionUrl)
  const db = mongoConnectionFactory.connectToDB(connectionString)

  const query_count = prometheus.Counter({
    name: 'mongodb_query_count',
    help: 'Total number of mongodb queries.',
    labelNames: ['function', 'collectionFunc']
  })

  const error_count = prometheus.Counter({
    name: 'mongodb_query_errors',
    help: 'Number of failed mongodb queries.',
    labelNames: ['function', 'collectionFunc']
  })

  const success_count = prometheus.Counter({
    name: 'mongodb_query_sucesses',
    help: 'Number of faiuled mongodb queries.',
    labelNames: ['function', 'collectionFunc']
  })

  const query_time = prometheus.Histogram({
    name: 'mongodb_query_time',
    help: 'Time taken by mongodb queries.',
    labelnames: ['function', 'collectionFunction']
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
        const labels = {
          function: metricsWrapper.caller().name,
          collectionFunction: k
        }

        const startTime = new Date()

        // couple helper lambdas for reporting
        const recordSuccess = () => {
          const endTime = new Date()
          query_time.observe(labels, (endTime - startTime) / 1000)
          success_count.inc(labels, 1, endTime)
        }
        const recordFailure = () => {
          error_count.inc(labels, 1, new Date())
        }

        query_count.inc(labels, 1, startTime)

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
  return db
}