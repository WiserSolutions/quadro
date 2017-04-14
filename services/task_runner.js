module.exports = class {
  constructor(app, log, container) {
    this.app = app
    this.log = log
    this.container = container
    this.tasks = {}
  }

  async initialize() {
    await Promise.map(
      this.app.glob('tasks/*.js', { dirs: ['quadro', 'app'], verbose: true }),
      _ => this.registerTask(_)
    )
  }

  registerTask(file) {
    const _ = require('lodash')
    let taskName = _.camelCase(file.relativePath.replace(/^tasks\/|\.js$/gi, ''))
    this.tasks[taskName] = file.absolutePath
  }

  async run(name) {
    let file = this.tasks[name]
    if (!file) {
      this.log.error({ taskName: name }, 'Unknown task')
      return process.exit(127)
    }

    let taskModule = require(file)
    let task = await this.container.create(taskModule)
    if (task && task.run) await task.run()

    process.exit(0)
  }
}
