const Paths = require('./paths')
const bluebird = require('bluebird')
const glob = bluebird.promisify(require('glob'))
const path = require('path')
const _ = require('lodash')

module.exports = class {
  async initialize() {
    this.env = process.env.NODE_ENV || 'development'
    this.cliParams = require('minimist')(process.argv.slice(2))
    this.appDir = await Paths.appDir()
    this.quadroDir = await Paths.quadroDir()
    this.name = require(`${this.appDir}/package.json`).name
  }

  async run() {
    this.waitForInput()
  }

  waitForInput() {
    this.log.info('Ctrl+C to quit')
    process.stdin.resume()
  }

  async glob(pattern, opts) {
    opts = opts || {}
    let dirs = (opts.dirs || ['app'])
      .map(_ => this.resolveDirAlias(_))
    let files = await Promise.map(dirs, _ => glob(path.join(_, pattern)))

    return _.flatten(files)
  }

  resolveDirAlias(dir) {
    if (dir === 'app') return this.appDir
    if (dir === 'quadro') return this.quadroDir
    if (dir === 'quadroLib') return path.join(this.quadroDir, 'lib')
    return dir
  }
}
