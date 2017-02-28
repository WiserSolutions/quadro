const Server = require('../lib/http_server/server')

module.exports = async function(app) {
  let server = new Server(app)
  await server.initialize()
}
