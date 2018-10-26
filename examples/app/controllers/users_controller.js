const AsyncFs = require('mz/fs')

module.exports = class {
  constructor(userControllerDep) {
    this.dep = userControllerDep
  }

  async show(ctx) {
    ctx.body = `${this.dep} ${ctx.params.id}`
  }

  async create(ctx) {
    try {
      const file = ctx.request.files.file
      const fileContent = await AsyncFs.readFile(file.path, 'utf8')
      ctx.body = fileContent
      ctx.status = 201
    } catch (err) {
      Q.log.error({ err }, 'Error uploading file')
      this.handleError(err, ctx)
    }
  }
}
