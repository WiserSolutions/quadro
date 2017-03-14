const request = requirep('request-promise')

module.exports = function(container) {
  container.registerSingleton('request', request, { type: 'object' })
}
