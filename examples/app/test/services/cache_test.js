/* eslint no-unused-expressions: 0 */

describe('Cache', function() {
  let cache

  beforeEach(async function() {
    cache = await Q.container.getAsync('cache')
    await cache.clear()
  })

  describe('set', function() {
    it('caches the value', async function() {
      await cache.set('a', 1)
      expect(await cache.get('a')).to.eql('1')
    })
  })

  describe('get', function() {
    it('returns undefined if key does not exist', async function() {
      expect(await cache.get('non_existing')).to.be.undefined
    })
  })

  describe('invalidate', function() {
    it('removes the key from cache', async function() {
      await cache.set('a', 1)
      await cache.invalidate('a')
      expect(await cache.get('a')).to.be.undefined
    })
  })

  describe('clear', function() {
    it('removes all keys from cache', async function() {
      await cache.set('a', 1)
      await cache.set('b', 1)
      await cache.clear()
      expect(await cache.get('a')).to.be.undefined
      expect(await cache.get('b')).to.be.undefined
    })
  })
})
