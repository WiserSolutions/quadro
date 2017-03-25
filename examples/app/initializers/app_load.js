module.exports = function(app) {
  app.on('loaded', async function(app) {
    await Promise.delay(50)
    app.appLoadEventInitializerSuccess = true
  })
}
