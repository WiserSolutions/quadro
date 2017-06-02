const fs = require('mz/fs')
const path = require('path')

module.exports = class {
  static async appDir() {
    return this.getPackageRootDir(require.main.filename)
  }

  static async quadroDir() {
    return this.getPackageRootDir(__dirname)
  }

  static async getPackageRootDir(dir) {
    if (dir === '/') {
      console.log('Unable to locate node package root dir (the one with package.json). Aborting.')
      process.exit(1)
    }

    const PACKAGE_FILE = 'package.json'

    let supposedPackagePath = path.join(dir, PACKAGE_FILE)
    let exist = await fs.exists(supposedPackagePath)
    if (exist) return dir

    return this.getPackageRootDir(path.resolve(dir, '..'))
  }
}
