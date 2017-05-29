/* eslint no-unused-expressions: 0 */

describe('Lock', function() {
  let Lock
  beforeEach(async function() {
    Lock = await Q.container.getAsync('lockFactory')
  })

  afterEach(async function() {
    Lock.releaseAll()
  })

  describe('acquire', function() {
    it('returns a lock instance', async function() {
      let lock = await Lock.acquire('some_name', { timeout: 50 })
      expect(lock).to.be.ok
    })

    it('can not acquire the lock twice', async function() {
      expect(await Lock.acquire('some_name', { timeout: 100 })).to.be.ok
      expect(await Lock.acquire('some_name', { timeout: 100 })).to.not.be.ok
    })
  })
})
