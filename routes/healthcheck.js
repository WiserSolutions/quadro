module.exports = function(router, config) {
  let endpoint = config.get('quadro.http.healthcheck.endpoint', '/healthcheck')
  router.resource(endpoint, 'healthcheck')
}
