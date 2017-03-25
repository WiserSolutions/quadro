module.exports = async function(container) {
  let httpApp = await container.create(require('../lib/http_server/server'))
  return await httpApp.listen()
}
