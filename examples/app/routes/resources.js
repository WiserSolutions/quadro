module.exports = function(router) {
  router.resource('users')
  router.resource('/admin_users', 'users')
}
