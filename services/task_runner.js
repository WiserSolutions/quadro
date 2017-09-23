module.exports = class {
  constructor(app, log, container) {
    this.app = app
    this.log = log
    this.container = container
    this.tasks = {}
  }

  async initialize() {
    await Promise.map(
      this.app.glob('tasks/*.js', { dirs: ['quadro', 'app', 'plugins'], verbose: true }),
      _ => this.registerTask(_)
    )
  }

  registerTask({ relativePath, absolutePath, namespace }) {
    const _ = require('lodash')
    let taskName = _.camelCase(relativePath.replace(/^tasks\/|\.js$/gi, ''))
    if (namespace) taskName = `${namespace}:${taskName}`
    this.tasks[taskName] = absolutePath
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
