const _ = require('lodash')

module.exports = async function(app, container, log) {
  const cmd = Q.app.getAppCommand()
  const dirs = cmd !== 'simple-task' ? ['quadro', 'app', 'plugins'] : ['quadro']

  let serviceFiles = app.glob(
    'services/**/*.js',
    { dirs, verbose: true }
  )

  await Promise.map(serviceFiles, function({ relativePath, namespace, absolutePath }) {
    let svcName = buildName(relativePath)
    if (namespace) svcName = `${namespace}:${svcName}`
    let registeredName = `services:${svcName}`
    log.debug({ registeredName }, 'Loading')
    container.registerSingleton(
      registeredName,
      require(absolutePath),
      { aliases: [ svcName ] }
    )
  })
}

function buildName(name) {
  return name
    .replace(/^services\/|\.js/g, '')
    .split('/')
    .map(_.camelCase)
    .join(':')
}
