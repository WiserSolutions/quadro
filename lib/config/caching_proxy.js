module.exports = function(cache, provider, ttl) {
  this.get = async function(key) {
    const cacheKey = `config:${key}`
    let value = await cache.get(cacheKey)
    if (value === undefined) value = await provider.get(...arguments)
    await cache.set(cacheKey, value, ttl * 1000)
    return value
  }

  this.set = async function() { return provider.set(...arguments) }
}
