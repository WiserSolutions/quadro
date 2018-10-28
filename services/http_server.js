module.exports = async function(container, app, config) {
  let httpApp = await container.create(require('../lib/http_server/server'))

  const isEnvWithoutServer = app.isREPL || app.isTask
  const forceListen = config.get('quadro.http.force')

  if (!isEnvWithoutServer || forceListen) return httpApp.listen()
}
