module.exports = async function(container) {
  container.registerSingleton('pubsub', require('./../lib/pubsub/pubsub'))
}
