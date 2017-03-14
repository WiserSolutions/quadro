module.exports = async function(app, container, log) {
  let serviceFiles = await app.glob(
    'services/*.js',
    { dirs: ['quadro', 'app'], verbose: true }
  )
  await Promise.map(serviceFiles, function(fileDetails) {
    let svcName = fileDetails.relativePath.replace(/^services\/|\.js/g, '')
    let registeredName = `services:${svcName}`
    log.debug({ registeredName }, 'Loading')
    container.registerSingleton(registeredName, require(fileDetails.absolutePath), { type: 'class' })
  })
}
