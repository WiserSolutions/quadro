const path = require('path')
const fs = requirep('mz/fs')
const _ = require('lodash')

module.exports = class {
  constructor(app) {
    this.app = app
    this.versionFile = path.join(this.app.appDir, 'version.json')
  }

  async getVersionJSON() {
    const contents = await fs.readFile(this.versionFile, 'utf-8')
    try {
      return JSON.parse(contents)
    } catch (err) {
      Q.log.debug({ err, versionFile: this.versionFile }, 'Unable to parse version file as json')
      return contents
    }
  }

  async getGitVersion() {
    const gitlog = requirep('gitlog').default
    const fields = [
      'hash', 'abbrevHash', 'authorName', 'subject',
      'body', 'authorDate', 'authorDateRel'
    ]

    const options = { repo: this.app.appDir, fields, number: 10 }
    return gitlog(options)
      .map(x => _.pick(x, fields))
  }

  async getVersion() {
    if (await fs.exists(this.versionFile)) return this.getVersionJSON()
    else return this.getGitVersion()
  }
}
