/* eslint no-unused-expressions: 0 */

describe('Models', function() {
  it('exposes Q.Models namespace', function() {
    expect(Q.Models).to.be.ok
  })

  it('registers models in Q.Models namespace', function() {
    expect(Q.Models.UserPermission).to.equal(require('../models/user_permission'))
  })

  it('registers Q.Models as `models` dependency', function() {
    expect(Q.container.get('models')).to.equal(Q.Models)
  })
})
