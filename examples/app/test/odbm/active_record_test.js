/* eslint no-unused-expressions: 0 */

describe('ActiveRecord', function() {
  const User = Q.Model('user')
  let collection

  beforeEach(async function() {
    let mongo = await Q.container.getAsync('mongo')
    collection = mongo.collection('users')
    await User.deleteAll()
  })

  describe('create', function() {
    it('persists the record', async function() {
      let user = await User.create({ firstName: 'John' })
      let record = await collection.findOne({ id: user.id })
      expect(record.first_name).to.eql('John')
    })
  })

  describe('get', function() {
    it('returns the record', async function() {
      let attrs = { last_name: 'get' }
      await collection.insertOne(attrs)
      expect(attrs._id).to.be.ok
      let user = await User.get(attrs._id)
      expect(user).to.eql(new User({ id: attrs._id, lastName: 'get' }))
    })
  })

  describe('find', function() {
    it('returns records', async function() {
      let id1 = await createAndGetId({ last_name: 'Jefferson', type: 'student' })
      let id2 = await createAndGetId({ last_name: 'Richardson', type: 'student' })
      await createAndGetId({ last_name: 'Bush', type: 'teacher' })
      let users = await User.find({ type: 'student' })
      expect(users).to.eql([
        new User({ lastName: 'Jefferson', type: 'student', id: id1 }),
        new User({ lastName: 'Richardson', type: 'student', id: id2 })
      ])
    })
  })

  async function createAndGetId(attrs) {
    let model = await User.create(attrs)
    return model._getAttr('id')
  }
})
