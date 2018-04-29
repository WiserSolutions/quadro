module.exports = class MetricsLogger {
  constructor(logger) {
    this.logger = logger
    this.metricsBuffer = {}
    this.metricsNextFlushAt = null

    // Default: 5 sec
    const flushInterval = Q.config.get('quadro.logger.metrics_flush_interval', 5) * 1000

    this.timeGranularity = 60000

    this.metricsIntervalId = setInterval(() => this.flushMetrics(), flushInterval)
  }

  flushMetrics() {
    if (this.metricsBuffer && Object.keys(this.metricsBuffer).length) {
      this.logger.info({ batch: Object.values(this.metricsBuffer) })
      this.metricsBuffer = {}
    }
  }

  getKey(dimensions, time) {
    return Object.keys(dimensions).sort().map(k => {
      let value = dimensions[k]
      if (value instanceof Array) value = value.sort()
      return `${k}:${value}`
    }).join('_') + time.toString()
  }

  log(name, dimensions, values = {}) {
    const time = Math.floor(Date.now() / this.timeGranularity) * this.timeGranularity
    const record = { d: { metric: name, ...dimensions }, ...values, time }
    const key = this.getKey(record.d, time)
    if (!this.metricsBuffer[key]) {
      this.metricsBuffer[key] = { ...{ sum: 0, count: 1 }, ...record }
    } else {
      this.metricsBuffer[key].sum += values.sum || 0
      this.metricsBuffer[key].count += values.count || 1
    }
  }
}
