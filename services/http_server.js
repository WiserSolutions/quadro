module.exports = async function(container, app, config) {
  const isEnvWithoutServer = app.isREPL || app.isTask
  const forceListen = config.get('quadro.http.force')

  if (!isEnvWithoutServer || forceListen) {
    const httpApp = await container.create(require('../lib/http_server/server'))
    return await httpApp.listen()
  }
}
