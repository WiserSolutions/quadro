module.exports = async function() {
  Q.log.info('Task without initialization ran')
  global.simpleTaskExecuted = true
}
