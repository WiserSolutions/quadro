const Paths = require('./paths')
const bluebird = require('bluebird')
const glob = bluebird.promisify(require('glob'))
const path = require('path')
const _ = require('lodash')
const EventEmitter = require('events-async')

module.exports = class extends EventEmitter {
  async initialize() {
    this.env = process.env.NODE_ENV || 'development'
    this.cliParams = require('minimist')(process.argv.slice(2))
    this.appDir = await Paths.appDir()
    this.quadroDir = await Paths.quadroDir()
    this.name = require(`${this.appDir}/package.json`).name

    if (this.getAppCommand() === 'test') {
      this.env = 'test'
      process.env.NODE_ENV = 'test'
    }
  }

  getAppCommand() {
    return (this.cliParams._ && this.cliParams._[0]) || 'run'
  }

  async run() {
    this.waitForInput()
  }

  waitForInput() {
    console.log('Ctrl+C to quit')
    process.stdin.resume()
  }

  async glob(pattern, opts) {
    opts = opts || {}
    let dirs = (opts.dirs || ['app'])
      .map(_ => this.resolveDirAlias(_))
    let files = await Promise.map(dirs, _ => readFilesInDir(_, pattern))

    return _.flatten(files).map(_ => opts.verbose ? _ : _.absolutePath)
  }

  resolveDirAlias(dir) {
    if (dir === 'app') return this.appDir
    if (dir === 'quadro') return this.quadroDir
    if (dir === 'quadroLib') return path.join(this.quadroDir, 'lib')
    return dir
  }
}

async function readFilesInDir(dir, pattern) {
  return Promise.map(
    glob(path.join(dir, pattern)),
    function(file) {
      return {
        absolutePath: file,
        relativePath: path.relative(dir, file),
        basePath: dir
      }
    }
  )
}
