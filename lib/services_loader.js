const _ = require('lodash')

module.exports = async function(app, container, log) {
  let serviceFiles = app.glob(
    'services/**/*.js',
    { dirs: ['quadro', 'app', 'plugins'], verbose: true }
  )

  await Promise.map(serviceFiles, function({ relativePath, namespace, absolutePath }) {
    let svcName = buildName(relativePath)
    if (namespace) svcName = `${namespace}:${svcName}`
    const registeredName = `services:${svcName}`
    log.debug({ registeredName }, 'Loading')
    const serviceModule = require(absolutePath)
    const moduleAliases = serviceModule['@aliases'] || []
    container.registerSingleton(
      registeredName,
      serviceModule,
      { aliases: [ svcName ].concat(moduleAliases) }
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
