module.exports = function(router) {
  router.post('/hello', async function(ctx) {
    console.log(this)
    console.log(ctx)
    ctx.body = 'yep!'
  })
}
