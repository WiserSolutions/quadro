const fs = require('mz/fs')
const path = require('path')

module.exports = class {
  static async appDir() {
    return this.getPackageRootDir(process.cwd())
  }

  static async quadroDir() {
    return this.getPackageRootDir(__dirname)
  }

  static async getPackageRootDir(dir) {
    const PACKAGE_FILE = 'package.json'

    let supposedPackagePath = path.join(dir, PACKAGE_FILE)
    let exist = await fs.exists(supposedPackagePath)
    if (exist) return dir

    return this.getPackageRootDir(path.resolve(dir, '..'))
  }
}
