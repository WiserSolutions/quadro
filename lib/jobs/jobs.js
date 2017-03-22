module.exports = class {
  constructor(log, container) {
    this.log = log
    this.container = container
    this.__registered = {}
  }

  async register(job, name) {
    this.__registered[name] = this.container.create(job)
    this.scheduleJob(job, name)
  }

  async scheduleJob(job, name) {
    while (true) {
      this.log.debug({ job: name }, 'Executing job')
      await this.__registered[name].run()
      await Promise.delay(this.getIntervalMillis(job, name))
    }
  }

  getIntervalMillis(job, name) {
    if (job['@interval']) return job['@interval'] * 1000
    let configInterval = this.config.get(`jobs.${name}.interval`)
    if (!configInterval) throw new Error(`Interval not set for job '${name}'`)
    return configInterval * 1000
  }
}
