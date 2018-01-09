// Can be used like this
// ./mocha ./node_modules/quadro/lib/test/independent_loader.js test/**/*_test.js
// same results as node app.js test
//
// enables usage of external testing tools (IDE, CI, reporting, executing of one test, change of masks)
require.main.filename = require.main.filename.replace('/node_modules/mocha/bin/_mocha', '')
const app = require('../index.js')

before(async function() {
  this.timeout(10000) // because it can take really time!
  await app() // load application
  require('./initialize_tests') // initialize tests
})
