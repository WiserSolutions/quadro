module.exports = class {
  constructor(versionRetreiver) {
    this.versionRetreiver = versionRetreiver
  }

  async index(ctx) {
    ctx.body = await this.versionRetreiver.getVersion()
  }
}
