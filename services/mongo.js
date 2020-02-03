const {getCaller} = require('../lib/callstack.js')

module.exports = function(config, app, mongoConnectionFactory, prometheus) {
  const dbName = `${app.name}_${app.env}`
  const defaultConnectionUrl = `mongodb://localhost:27017/${dbName}`
  const connectionString = config.get('db.endpoint', defaultConnectionUrl)
  const db = mongoConnectionFactory.connectToDB(connectionString)

  const labelNames = ['function', 'filename', 'lineno', 'operation']
  const metricsBlacklist = config.get('db.metricsBlacklist', ['createIndex'])
  const metrics = {
    queryCount: new prometheus.Counter({
      name: `${prometheus.prefix}mongodb_query_count`,
      help: 'Total number of mongodb queries.',
      labelNames
    }),
    errorCount: new prometheus.Counter({
      name: `${prometheus.prefix}mongodb_query_errors`,
      help: 'Number of failed mongodb queries.',
      labelNames
    }),
    queryTime: new prometheus.Histogram({
      name: `${prometheus.prefix}mongodb_query_time`,
      help: 'Time taken by mongodb queries.',
      buckets: config.get('db.queryTimeBuckets', [0.1, 0.5, 2, 10, 60]),
      labelNames
    })
  }

  // wrap the db connection with metrics logic
  return db.then(db => {
    db.collection = metricsWrapConstructor(db.collection.bind(db), metrics, metricsBlacklist)
    db.eval = metricsWrapFunction(db.eval.bind(db), 'eval', metrics)
    db.aggregate = metricsWrapFunction(db.aggregate.bind(db), 'aggregate', metrics)
    return db
  })
}

function metricsWrapConstructor(constructor, metrics, metricsBlacklist) {
  return function metricsConstructorWrapper() {
    let obj = constructor(...arguments)
    for (const k in obj) {
      if (typeof obj[k] !== 'function') continue
      if (metricsBlacklist.indexOf(k) >= 0) continue

      const fn = obj[k].bind(obj)
      obj[k] = metricsWrapFunction(fn, k, metrics)
    }
    return obj
  }
}

function metricsWrapFunction(fn, fnName, metrics) {
  return function metricsFunctionWrapper() {
    // SETUP
    // labels for all metrics
    const caller = getCaller()
    const labels = {
      function: caller.name,
      filename: caller.fileName,
      lineno: caller.line && caller.column ? `${caller.line}:${caller.column}` : undefined,
      operation: fnName // mongo api function name
    }
    const timer = metrics.queryTime.startTimer(labels)

    // couple helpers for reporting
    function recordSuccess() {
      timer()
    }
    function recordFailure() {
      metrics.errorCount.inc(labels)
    }

    // WRAP AND REPORT
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
