module.exports = class {
  constructor(log, container, config, app) {
    this.log = log
    this.container = container
    this.__registered = {}
    this.config = config
    this.app = app
  }

  async register(job, name) {
    this.__registered[name] = await this.container.create(job)
    try {
      if (!this.shouldSchedule(name)) return

      this.scheduleJob(job, name)
        .catch((err) => this.log.error({ err, jobName: name }, 'Error registering job'))
    } catch (err) {
      this.log.error({ err })
    }
  }

  scheduleJob(job, name) {
    let interval = this.getIntervalMillis(job, name)
    return Promise.delay(interval)
      .then(() => this.__registered[name].run())
      .catch(err => this.log.error({ err, jobName: name }, 'Error while running job'))
      .then(() => this.scheduleJob(job, name))
  }

  shouldSchedule(name) {
    return this.config.get(`quadro.jobs.${name}.enabled`,
      this.config.get(`quadro.jobs.all.enabled`, !this.app.isTestEnv && !this.app.isREPL)
    )
  }

  getIntervalMillis(job, name) {
    if (job['@interval']) return job['@interval'] * 1000
    let configInterval = this.config.get(`quadro.jobs.${name}.interval`)
    if (!configInterval) throw new Error(`Interval not set for job '${name}'`)
    return configInterval * 1000
  }
}
