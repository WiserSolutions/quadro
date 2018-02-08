const path = require('path')

module.exports = async function(app, container) {
  return Promise.map(
    app.glob(`handlers/**/*.js`),
    async (file) => ({
      handler: await container.create(require(file)),
      messageType: path.basename(file, '.js')
    })
  )
}
