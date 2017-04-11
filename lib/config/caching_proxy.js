module.exports = function(cache, provider, ttl) {
  this.get = async function(key) {
    const cacheKey = `config:${key}`
    let value = await cache.get(cacheKey)
    Q.log.info({ key, value })
    if (value === undefined) value = await provider.get(...arguments)
    await cache.set(cacheKey, value, ttl)
    return value
  }

  this.set = async function() { return await provider.set(...arguments) }
}
