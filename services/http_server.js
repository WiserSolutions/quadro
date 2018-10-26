module.exports = async function(container, app, config) {
  let httpApp = await container.create(require('../lib/http_server/server'))

  const isRepl = app.getAppCommand() === 'repl'
  const forceListen = config.get('quadro.http.force')

  if (!isRepl || forceListen) return httpApp.listen()
}
