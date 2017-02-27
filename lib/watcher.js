const nodemon = require('nodemon')

module.exports = class {
  constructor(app) {
    this.app = app
  }

  run() {
    let cmdLine = this.buildCmdLine()
    log.debug({ cmdLine }, 'Initializing watcher')
    nodemon({
      exec: cmdLine,
      ext: 'js json yml yaml html',
      // Monitor app directory and quadro module directory (for development)
      watch: [this.app.appDir, this.app.quadroDir]
    })
    nodemon.on('quit', _ => process.exit(0))

    // Never resolve the promise
    return new Promise(_ => {})
  }

  buildCmdLine() {
    let scriptExec = process.argv.slice(0, 2).join(' ')
    let args = this.app.cliParams._.join(' ')

    let cmdLine = `${scriptExec} ${args}`
    return cmdLine
  }
}
