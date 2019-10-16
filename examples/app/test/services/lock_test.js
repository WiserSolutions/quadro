/* eslint no-unused-expressions: 0 */
const _ = require('lodash')

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

    it('only one client can acquire a lock', async function() {
      const swarm = _.fill(Array(10), 'some_name')
      const results = await Promise.all(
        swarm.map(lockName => (Lock.acquire('some_name', { timeout: 1000 }))))
      expect(_.compact(results).length).to.be.equal(1)
    })
  })
})
