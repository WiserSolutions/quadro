module.exports = async function(log) {
  log.info('Demo task being run')
  global.demoTaskRunResult = 'taskRun'
}
