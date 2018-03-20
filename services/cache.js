module.exports = class {
  constructor(redis) {
    this.redis = redis
  }

  async get(key) {
    this.validateKey(key)
    let value = await this.redis.getAsync(`cache:${key}`)
    if (value === null) return undefined
    return value
  }

  async set(key, value, ttl) {
    this.validateKey(key)
    if (value === undefined) {
      Q.log.warn(`Attempt to cache 'undefined' as the value of key ${key}. Will be stored as null`)
    }
    const options = ttl ? ['PX', ttl] : []
    await this.redis.setAsync(`cache:${key}`, value || null, ...options)
  }

  async invalidate(key) {
    this.validateKey(key)
    await this.redis.delAsync(`cache:${key}`)
  }

  async clear() {
    await Promise.map(
      this.redis.keysAsync('cache:*'),
      _ => this.redis.delAsync(_)
    )
  }

  validateKey(key) {
    if (!key) throw new Q.Errors.InvalidArgumentError({ key })
  }
}
