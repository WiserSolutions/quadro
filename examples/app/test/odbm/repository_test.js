/* eslint no-unused-expressions: 0 */

describe('Model Repository', function() {
  class TestAdapter {}
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

  describe('delete', function() {
    it('calls adapter destroy method', async function() {
      testAdapter.delete = this.sinon.spy()
      await repo.delete(new User({ id: 123 }))
      expect(testAdapter.delete).to.be.calledWith('users', 123)
    })
  })

  describe('get', function() {
    it('calls `adapter.get`', async function() {
      testAdapter.get = this.sinon.stub()
      await repo.get(1234)
      expect(testAdapter.get).to.be.calledWith('users', 1234)
    })

    it('returns a model', async function() {
      testAdapter.get = this.sinon.stub().callsFake(async () => {
        return { first_name: 'John', id: 1234 }
      })
      let model = await repo.get(1234)
      expect(model).to.eql(new User({ id: 1234, firstName: 'John' }))
    })
  })

  describe('find', function() {
    beforeEach(function() {
      testAdapter.find = this.sinon.stub().callsFake(async () => [
        { id: 1, first_name: 'John' },
        { id: 2, first_name: 'Jonny' }
      ])
    })

    it('calls adapter `.find` method', async function() {
      repo.find({ firstName: 'o*n' })
      expect(testAdapter.find).to.be.calledWith('users', { first_name: 'o*n' })
    })

    it('returns records returned by adapter `.find`', async function() {
      let result = await repo.find({ firstName: 'o*n' })
      expect(result.length).to.equal(2)
      expect(result).to.eql([
        new User({ id: 1, firstName: 'John' }),
        new User({ id: 2, firstName: 'Jonny' })
      ])
    })
  })
})
