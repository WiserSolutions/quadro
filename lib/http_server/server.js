const Koa = require('koa')

module.exports = class {
  constructor(app) {
    this.app = app
    this.port = app.config.get('quadro.http.port', 3000)
  }

  async initialize() {
    
  }
}
