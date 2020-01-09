module.exports = function(config, app, mongoConnectionFactory, prometheus) {
  const dbName = `${app.name}_${app.env}`
  const defaultConnectionUrl = `mongodb://localhost:27017/${dbName}`
  const connectionString = config.get('db.endpoint', defaultConnectionUrl)
  const db = mongoConnectionFactory.connectToDB(connectionString)

  const labelNames = ['function', 'filename', 'operation']
  const metrics = {
    queryCount: new prometheus.Counter({
      name: 'mongodb_query_count',
      help: 'Total number of mongodb queries.',
      labelNames
    }),
    errorCount: new prometheus.Counter({
      name: 'mongodb_query_errors',
      help: 'Number of failed mongodb queries.',
      labelNames
    }),
    successCount: new prometheus.Counter({
      name: 'mongodb_query_successes',
      help: 'Number of successful mongodb queries.',
      labelNames
    }),
    queryTime: new prometheus.Histogram({
      name: 'mongodb_query_time',
      help: 'Time taken by mongodb queries.',
      labelNames
    })
  }

  // wrap the db connection with metrics logic
  db.collection = metricsConstructorWrapper(db.collection, metrics)
  db.db = metricsConstructorWrapper(db.db, metrics)
  return db
}

/**
 * Get information about the function which called the current function.
 * (i.e. get the caller of the caller of this function)
 * This will ignore unamed lambda functions if it is able to find a named function in the call stack.
 * @return {Object} {name, file, line, column}
 */
function getCaller() {
  const FUNCTION_NAME = /^at ([\w.]+) \(.+\)$/
  const FUNCTION_LOCATION = /\/([-\w]+?\.(?:\w+)):(\d+):(\d+)/
  let stack = new Error().stack
    .split('\n')
    .map(s => s.trim())
    .slice(3) // remove Error line and stack entry for this function and the calling fn (want caller of the caller)
  for (const i of stack) {
    let m = FUNCTION_NAME.exec(i)
    if (!m) continue
    const name = m[1]
    m = FUNCTION_LOCATION.exec(i)
    if (m) {
      return {name, file: m[1], line: m[2], column: m[3]}
    } else {
      return {name}
    }
  }
  // can't find a named function, just find first lambda
  const m = FUNCTION_LOCATION.exec(stack[0])
  return m ? {file: m[1], line: m[2], column: m[3]} : {}
}

function metricsConstructorWrapper(constructor, metrics) {
  return function metricsObjectWrapper() {
    const apiObj = constructor(...arguments)
    // wrap all of the new obj's methods
    for (const k in apiObj) {
      if (typeof k !== 'function') continue
      const fn = apiObj[k]
      apiObj[k] = function metricsFunctionWrapper() {
        // labels for all metrics
        const caller = getCaller()
        const labels = {
          function: caller.name,
          filename: caller.file,
          operation: k // mongo api function name
        }

        const startTime = new Date()

        // couple helper lambdas for reporting
        const recordSuccess = () => {
          const endTime = new Date()
          metrics.queryTime.observe(labels, (endTime - startTime) / 1000)
          metrics.successCount.inc(labels)
        }
        const recordFailure = () => {
          metrics.errorCount.inc(labels)
        }

        metrics.queryCount.inc(labels)

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
        if ('then' in result) {
          // result is a promise
          result.then(recordSuccess).catch(recordFailure)
        } else {
          recordSuccess()
        }
        return result
      }
    }
    return apiObj
  }
}
