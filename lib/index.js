const App = require('./app')

module.exports = async function() {
  global.app = new App()
  await app.initialize()
    .then(() => app.run())
    .catch(function(err) {
      if (global.log) log.error({ err })
      else console.log(err)
    })
}
