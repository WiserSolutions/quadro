// Can be used like this
// ./mocha ./node_modules/quadro/lib/test/independent_loader.js test/**/*_test.js
// same results as node app.js test
//
// enables usage of external testing tools (IDE, CI, reporting, executing of one test, change of masks)

const app = require('../index.js')

before(async function() {
  await app() // load application
  require('./initialize_tests') // initialize tests
})
