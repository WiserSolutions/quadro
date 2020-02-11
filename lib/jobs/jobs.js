module.exports = class {
  constructor(log, container, config, prometheus) {
    this.log = log

    this.metrics = {
      duration: new prometheus.Histogram({
        name: `${prometheus.prefix}job_duration`,
        help: 'How long jobs take to complete.',
        buckets: [5, 15, 50, 100, 500, 2000],
        labelNames: ['jobName']
      }),
      errors: new prometheus.Counter({
        name: `${prometheus.prefix}job_error_count`,
        help: 'Number of erros being encountered while trying to run jobs.',
        labelNames: ['jobName']
      }),
      running: new prometheus.Gauge({
        name: `${prometheus.prefix}job_running`,
        help: 'Number of currently running jobs.'
      }),
      totalJobs: new prometheus.Gauge({
        name: `${prometheus.prefix}job_total`,
        help: 'Total number of jobs which are either running or pending.'
      })
    }
    this.metrics.totalJobs.set(0)
    this.metrics.running.set(0)

    this.container = container
    this.__registered = {}
    this.config = config
  }

  async register(job, name) {
    this.__registered[name] = await this.container.create(job)
    try {
      this.scheduleJob(job, name)
        .catch((err) => {
          this.metrics.totalJobs.dec()
          this.log.error({ err, jobName: name }, 'Error registering job')
        })
      this.metrics.totalJobs.inc()
    } catch (err) {
      this.log.error({ err })
    }
  }

  scheduleJob(job, name) {
    let interval = this.getIntervalMillis(job, name)
    let timer
    return Promise.delay(interval)
      .then(() => {
        this.metrics.running.inc()
        timer = this.metrics.duration.startTimer({jobName: name})
        return this.__registered[name].run()
      })
      .catch(err => {
        this.metrics.running.dec()
        this.metrics.errors.inc({jobName: name})
        this.log.error({ err, jobName: name }, 'Error while running job')
      })
      .then(() => {
        timer()
        this.metrics.running.dec()
        return this.scheduleJob(job, name)
      })
  }

  getIntervalMillis(job, name) {
    if (job['@interval']) return job['@interval'] * 1000
    let configInterval = this.config.get(`quadro.jobs.${name}.interval`)
    if (!configInterval) throw new Error(`Interval not set for job '${name}'`)
    return configInterval * 1000
  }
}
