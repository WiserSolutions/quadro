module.exports = class {
  constructor(app, log, container, config) {
    this.app = app
    this.log = log
    this.container = container
    this.config = config
  }

  async initialize() {
    let jobs = await this.container.create(require('../lib/jobs/jobs'))
    this.container.registerSingleton('jobs', jobs)

    Q.jobs = jobs
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
