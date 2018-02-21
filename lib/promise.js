global.Promise = require('bluebird')
global.requirep = (m) => Promise.promisifyAll(require(m))

function getEnvVar(name) { return (process.env[name] || ''.toLowerCase()) }

function isTrue(envVar) {
  const val = getEnvVar(envVar)
  return val === 'true' || val === '1' || val === 'yes'
}

function isDebugEnv(envVar) {
  const val = getEnvVar(envVar)
  return val === 'dev' || val === 'development' || val === 'test' || !val
}

const isDebugEnvironment = isTrue('DEBUG') || isDebugEnv('NODE_ENV')

// http://bluebirdjs.com/docs/api/promise.config.html
if (isDebugEnvironment) {
  Promise.config({
    warnings: true,
    longStackTraces: true
  })
}
