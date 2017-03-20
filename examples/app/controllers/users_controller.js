module.exports = class {
  constructor(userControllerDep) {
    this.dep = userControllerDep
  }

  async show(ctx) {
    ctx.body = `${this.dep} ${ctx.params.id}`
  }
}
