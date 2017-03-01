global.Promise = require('bluebird')
global.requirep = (m) => Promise.promisifyAll(require(m))
