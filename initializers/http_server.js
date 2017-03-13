const Server = require('../lib/http_server/server')

module.exports = async function(container) {
  this.server = await container.create(Server)
}
