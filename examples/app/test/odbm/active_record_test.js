/* eslint no-unused-expressions: 0 */

describe('ActiveRecord', function() {
  const User = Q.Model('user', {
    attributes: {
      firstName: 'string',
      lastName: { type: 'string' }
    }
  })
  let collection

  beforeEach(async function() {
    let mongo = await Q.container.getAsync('mongo')
    collection = mongo.collection('users')
    await User.deleteAll()
  })

  describe('attribute accessors', function() {
    it('supports attribute getters', function() {
      let user = new User({ firstName: 'John' })
      expect(user.firstName).to.equal('John')
    })

    it('supports attribute setters', function() {
      let user = new User()
      user.firstName = 'John'
      expect(user._attrs.firstName, 'User should include the firstName attr').to.be.ok
    })

    it('generates an id attribute', async function() {
      let user = await User.create()
      expect(user.id, 'User should have an id').to.be.ok
    })
  })

  describe('create', function() {
    it('persists the record', async function() {
      let user = await User.create({ firstName: 'John' })
      let record = await collection.findOne({ _id: user.id })
      expect(record.first_name).to.eql('John')
    })
  })

  describe('deleteAll', function() {
    beforeEach(async function() {
      await User.create({ firstName: 'John' })
      await User.create({ firstName: 'Paul' })
    })

    it('delete entire collection', async function() {
      await User.deleteAll()
      let count = await collection.count()
      expect(count).to.eql(0)
    })

    it('delete by query', async function() {
      await User.deleteAll({ firstName: 'John' })
      let count = await collection.count()
      expect(count).to.eql(1)
    })
  })

  describe('count', function() {
    beforeEach(async function() {
      await User.create({ firstName: 'John' })
      await User.create({ firstName: 'Paul' })
    })

    it('count entire collection', async function() {
      let count = await User.count()
      expect(count).to.eql(2)
    })

    it('count by query', async function() {
      let count = await User.count({ firstName: 'John' })
      expect(count).to.eql(1)
    })
  })

  describe('get', function() {
    it('returns the record', async function() {
      let attrs = { last_name: 'get' }
      await collection.insertOne(attrs)
      expect(attrs._id).to.be.ok
      let user = await User.get(attrs._id)
      expect(user).to.eql(new User({ id: attrs._id, lastName: 'get' }).applyChanges())
    })
  })

  describe('findOne', function() {
    it('returns first record if query is provided', async function() {
      let attrs = { last_name: 'Stewart' }
      await collection.insertOne(attrs)
      let user = await User.findOne({ lastName: 'Stewart' })
      expect(user).to.eql(new User({ id: attrs._id, lastName: 'Stewart' }).applyChanges())
    })
  })

  describe('find', function() {
    it('returns records', async function() {
      let id1 = await createAndGetId({ last_name: 'Jefferson', type: 'student' })
      let id2 = await createAndGetId({ last_name: 'Richardson', type: 'student' })
      await createAndGetId({ last_name: 'Bush', type: 'teacher' })
      let users = await User.find({ type: 'student' })
      expect(users).to.eql([
        new User({ lastName: 'Jefferson', type: 'student', id: id1 }).applyChanges(),
        new User({ lastName: 'Richardson', type: 'student', id: id2 }).applyChanges()
      ])
    })
  })

  describe('findOrBuild', function() {
    it('returns the model if exist', async function() {
      let attrs = { last_name: 'Stewart' }
      await collection.insertOne(attrs)

      let user = await User.findOrBuild({ lastName: 'Stewart' })
      expect(user).to.eql(new User({ id: attrs._id, lastName: 'Stewart' }).applyChanges())
    })

    it('builds the model if does not exist', async function() {
      let user = await User.findOrBuild({ lastName: 'Stewart' })
      expect(user).to.be.ok
      expect(user.lastName).to.eql('Stewart')
      expect(user.id).to.not.be.ok
    })
  })

  describe('save', function() {
    it('saves the record', async function() {
      let user = new User({ firstName: 'John' })
      await user.save()
    })

    it('can save a non-changed record', async function() {
      let user = new User({ firstName: 'John' })
      await user.save()
      await user.save()
      expect(await User.count()).to.eql(1)
    })
  })

  async function createAndGetId(attrs) {
    let model = await User.create(attrs)
    return model._getAttr('id')
  }
})
