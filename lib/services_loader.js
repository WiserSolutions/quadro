const _ = require('lodash')

module.exports = async function(app, container, log) {
  let serviceFiles = await app.glob(
    'services/**/*.js',
    { dirs: ['quadro', 'app'], verbose: true }
  )

  await Promise.map(serviceFiles, function(fileDetails) {
    let svcName = buildName(fileDetails.relativePath)
    let registeredName = `services:${svcName}`
    log.debug({ registeredName }, 'Loading')
    container.registerSingleton(
      registeredName,
      require(fileDetails.absolutePath),
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
