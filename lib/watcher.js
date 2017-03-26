const nodemon = require('nodemon')
global.Promise = require('bluebird')

module.exports = class {
  constructor(app, log, config) {
    this.app = app
    this.log = log
    this.config = config
  }

  initialize() {
    let cmdLine = this.buildCmdLine()
    this.log.debug({ cmdLine }, 'Initializing watcher')
    let options = {
      exec: cmdLine,
      ext: 'js json yml yaml html',
      // Monitor app directory and quadro module directory (for development)
      watch: [this.app.appDir, this.app.quadroDir]
    }
    let ignoreFiles = this.config.get('quadro.watcher.ignore')
    if (ignoreFiles) options.ignore = ignoreFiles
    nodemon(options)
    nodemon.on('restart', (files) => {
      this.log.debug({ files }, 'File change detected')
      this.log.warn('Restarting')
    })
    nodemon.on('exit', () => this.log.warn('App completed'))
    nodemon.on('crash', () => this.log.warn('App crashed'))
    nodemon.on('quit', _ => process.exit(0))

    // Never resolve the promise
    return new Promise((resolve, reject) => {})
  }

  buildCmdLine() {
    let scriptExec = process.argv.slice(0, 2).join(' ')
    let args = this.app.cliParams._.join(' ')

    let cmdLine = `${scriptExec} ${args}`
    return cmdLine
  }
}
