module.exports = function(log, app, container) {
  log.info(`function initializer of ${app.name}`)

  container.register('userControllerDep', 'John')
}
