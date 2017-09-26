/* eslint no-unused-expressions: 0 */

describe('Q.Model', function() {
  const User = Q.Model('user')

  beforeEach(async () => User.deleteAll() )

  it('creates a `Model` subclass', function() {
    let user = new User()
    expect(user).to.be.instanceof(Q.Model.Class)
  })

  describe('build', function() {
    it('initializes a new model', function() {
      let user = User.build({ firstName: 'John' })
      expect(user._attrs).to.eql({ firstName: { current: 'John', old: undefined } })
    })
  })

  describe('_getAttr', function() {
    it('returns attribute value', function() {
      let user = User.build({ firstName: 'John' })
      expect(user._getAttr('firstName')).to.equal('John')
    })
  })

  describe('changes', function() {
    it('returns changed attrs', function() {
      let user = User.build({ firstName: 'John' })
      expect(user.isDirty()).to.be.true
      expect(user.changes()).to.eql({ firstName: { current: 'John', old: undefined } })
    })

    describe('applyChanges', function() {
      it('applies any changes', function() {
        let user = User.build({ firstName: 'John' })
        user.applyChanges()
        expect(user.isDirty()).to.be.false
        expect(user.changes()).to.eql({})
      })
    })

    it('is non-empty after adding new attribute', function() {
      let user = User.build({ firstName: 'John' })
      user.applyChanges()
      user._setAttr('lastName', 'Smith')
      expect(user.changes()).to.eql({ lastName: { current: 'Smith', old: undefined } })
    })

    it('is non-empty after changing an attribute', function() {
      let user = User.build({ firstName: 'John' })
      user.applyChanges()
      user._setAttr('firstName', 'Vladimir')
      expect(user.changes()).to.eql({ firstName: { current: 'Vladimir', old: 'John' } })
    })
  })

  describe('serialize', function() {
    it('returns an object with attrs', function() {
      let user = User.build({ firstName: 'John', lastName: 'Smith' })
      expect(user.serialize()).to.eql({ firstName: 'John', lastName: 'Smith' })
    })

    it('does not return the _attrs object', function() {
      let user = User.build({ firstName: 'John' })
      let obj = user.serialize()
      obj.lastName = 'Smith'
      expect(user._attrs.lastName).to.be.undefined
    })
  })

  describe('save', function() {
    describe('existing record', function() {
      it('saving attributes after update', async function() {
        let firstName = 'John'
        let lastName = 'Lennon'
        let user = await User.create({ firstName })
        user._setAttr('lastName', lastName)
        await user.save()

        let newUser = await User.findOne({ lastName })
        expect(newUser._getAttr('firstName')).to.eql(firstName)
      })
    })

    describe('isNew', function() {
      it('returns true for new model', function() {
        let user = new User()
        expect(user.isNew()).to.be.true
      })

      it('returns false for a saved model', async function() {
        let user = new User({ firstName: 'John' })
        await user.save()
        expect(user.isNew()).to.be.false
      })

      it('returns false for a persisted and then modified model', async function() {
        let user = await User.create({ firstName: 'John' })
        user._setAttr('lastName', 'Lennon')
        expect(user.isNew()).to.be.false
      })

      it('returns true for new model with custom id', function() {
        let user = new User({ id: '123123123' })
        expect(user.isNew()).to.be.true
      })

      it('returns false after .find()', async function() {
        await User.create({ id: '123', firstName: 'John' })
        let user = await User.get('123')
        expect(user.isNew()).to.be.false
      })
    })

    describe('new record', function() {
      it('creates new record', async function() {
        let user = new User({ firstName: 'John' })
        await user.save()

        user = await User.findOne({ firstName: 'John' })
        expect(user._getAttr('firstName')).to.eql('John')
      })

      it('creates new record with custom id', async function() {
        let user = new User({ id: 'MyUser', firstName: 'Michael'})
        await user.save()

        user = await User.get('MyUser')
        expect(user._getAttr('id')).to.eql('MyUser')
        expect(user._getAttr('firstName')).to.eql('Michael')
      })
    })

    describe('multiple inserts', function() {
      it('creates multiple new records', async function() {
        await User.create([{ firstName: 'John' }, { firstName: 'Paul' }])

        let count = await User.count()
        expect(count).to.eql(2)
      })

      it('returns array of models', async function() {
        let result = await User.create([{ firstName: 'John' }, { firstName: 'Paul' }])
        expect(result).to.be.an('array')
      })

      it('returns one model', async function() {
        let result = await User.create({ firstName: 'John' })
        expect(result).to.not.be.an('array')
      })
    })
  })
})
