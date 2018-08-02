const _ = require('lodash')

module.exports = dirs => function(app, container, log) {
  const serviceFiles = app.glob(
    'services/**/*.js',
    { dirs, verbose: true }
  )

  serviceFiles.map(function({ relativePath, namespace, absolutePath }) {
    let svcName = buildName(relativePath)
    if (namespace) svcName = `${namespace}:${svcName}`
    const registeredName = `services:${svcName}`
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
