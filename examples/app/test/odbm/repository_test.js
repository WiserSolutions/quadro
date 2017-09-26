/* eslint no-unused-expressions: 0 */

const _ = require('lodash')

describe('Model Repository', function() {
  class TestAdapter {}
  const testAdapter = new TestAdapter()
  const User = Q.Model('user', {
    attributes: {
      myField: { physicalName: 'W_e_i_r_d___f_i_e_l_d' }
    }
  })
  const repo = new Q.Repository(User, testAdapter)

  describe('fields mapping', function() {
    [
      {
        name: 'as_is',
        model: Q.Model('asIsUser', { naming: { field: 'as_is' } }),
        collectionName: 'as_is_users',
        attrs: { MYfield: 'myvalue' },
        fields: { MYfield: 'myvalue' }
      },
      {
        name: 'custom physical name',
        model: Q.Model('customPhysName', { attributes: {
          myField: { physicalName: 'W_e_i_r_d___f_i_e_l_d' }
        }}),
        collectionName: 'custom_phys_names',
        attrs: { myField: 'weirdValue' },
        fields: { W_e_i_r_d___f_i_e_l_d: 'weirdValue' }
      },
      {
        name: 'custom collection name',
        model: Q.Model('customCollName', { physicalName: 'my_col_2' }),
        collectionName: 'my_col_2',
        attrs: { myField: 'hello' },
        fields: { my_field: 'hello' }
      }
    ].forEach(function(example) {
      const repo = new Q.Repository(example.model, testAdapter)

      describe(example.name, function() {
        it('model -> db', async function() {
          testAdapter.create = this.sinon.spy()
          let user = new example.model(example.attrs)
          await repo.save(user)
          expect(testAdapter.create).to.be.calledWith(example.collectionName, [example.fields])
        })

        it('db -> model', async function() {
          testAdapter.get = this.sinon.stub().callsFake(() => example.fields)
          let user = await repo.get('123')
          _.forEach(example.attrs, function(value, key) {
            expect(user._getAttr(key)).to.equal(value)
          })
        })
      })
    })
  })

  describe('save', function() {
    context('id not present', function() {
      it('creates a record', async function() {
        testAdapter.create = this.sinon.stub().returns([{ id: 'new_user_id' }])
        let model = new User({ firstName: 'John' })
        await repo.save(model)
        expect(testAdapter.create).to.be.calledWith('users', [{
          first_name: 'John'
        }])
        expect(model.isDirty()).to.be.false
        expect(model._getAttr('id')).to.equal('new_user_id')
      })
    })

    it('updates a record', async function() {
      testAdapter.update = this.sinon.spy()
      let user = new User({ id: 123, firstName: 'John' })
      this.sinon.stub(user, 'isNew').returns(false)
      repo.save(user)
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

    it('calls adapter deleteAll method', async function() {
      testAdapter.deleteAll = this.sinon.spy()
      await repo.deleteAll({ firstName: 'John' })
      expect(testAdapter.deleteAll).to.be.calledWith('users', { first_name: 'John' })
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

  describe('count', function() {
    it('calls adapter `.count` method', async function() {
      testAdapter.count = this.sinon.spy()
      await repo.count({ id: 123 })
      expect(testAdapter.count).to.be.calledWith('users', { id: 123 })
    })
  })
})
