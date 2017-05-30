/* eslint no-unused-expressions: 0 */

describe('Model Repository', function() {
  class TestAdapter {

  }
  const testAdapter = new TestAdapter()
  const User = Q.Model('user')
  const repo = new Q.Repository(User, testAdapter)

  describe('save', function() {
    context('id not present', function() {
      it('creates a record', async function() {
        testAdapter.create = this.sinon.stub().returns({ id: 'new_user_id' })
        let model = new User({ firstName: 'John' })
        await repo.save(model)
        expect(testAdapter.create).to.be.calledWith('users', {
          first_name: 'John'
        })
        expect(model.isDirty()).to.be.false
        expect(model._getAttr('id')).to.equal('new_user_id')
      })
    })

    it('updates a record', async function() {
      testAdapter.update = this.sinon.spy()
      repo.save(new User({ id: 123, firstName: 'John' }))
      expect(testAdapter.update).to.be.calledWith('users', 123, {
        first_name: 'John'
      })
    })
  })
})
