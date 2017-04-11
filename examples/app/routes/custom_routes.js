module.exports = function(router) {
  router.post('/hello', async function(ctx) {
    ctx.body = 'yep!'
  })
}
