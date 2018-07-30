const nodemon = require('nodemon')
global.Promise = require('bluebird')

module.exports = class {
  constructor(app, log, config) {
    this.app = app
    this.log = log
    this.config = config
  }

  // run the same command (just without the `--watch` flag) inside a watcher
  initialize() {
    const command = process.argv.filter(arg => arg !== '--watch').join(' ')
    this.log.debug({ command }, 'Initializing watcher')

    nodemon({
      exec: command,
      ext: 'js json yml yaml html',
      // Monitor app directory and quadro module directory (for development)
      watch: [this.app.appDir, this.app.quadroDir],
      ignore: this.config.get('quadro.watcher.ignore') || undefined
    })
    nodemon.on('restart', (files) => {
      this.log.debug({ files }, 'File change detected')
      this.log.warn('Restarting')
    })
    nodemon.on('exit', () => this.log.warn('App completed'))
    nodemon.on('crash', () => this.log.warn('App crashed'))
    nodemon.on('quit', () => process.exit(0))

    // Never resolve the promise
    return new Promise((resolve, reject) => {})
  }
}
