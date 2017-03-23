module.exports = class {
  constructor(app, log, container, config) {
    this.app = app
    this.log = log
    this.container = container
    this.config = config

    container.registerSingleton('jobs', require('../lib/jobs/jobs'))
  }

  async initialize() {
    Q.jobs = await this.container.getAsync('jobs')
    await Promise.map(
      await this.app.glob('jobs/*.js', { verbose: true }),
      async (job) => this.runJob(job)
    )
  }

  async runJob(jobFile) {
    let job = require(jobFile.absolutePath)
    let jobName = jobFile.relativePath.replace(/^jobs\/|\.js$/g, '')
    await Q.jobs.register(job, jobName)
  }
}
