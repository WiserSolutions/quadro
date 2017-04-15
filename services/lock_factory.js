module.exports = class {
  constructor(redis, log) {
    this.log = log
    this.redis = redis
    this.redisLock = require('redislock')
    this.LockAcquisitionError = this.redisLock.LockAcquisitionError
    this.LockReleaseError = this.redisLock.LockReleaseError
  }

  /**
   * acquire - Acquires a lock for key `key`
   *
   * @param  {String} key  Lock key
   * @param  {String|Object} opts Lock options or lock configuration key
   * @return {Lock|null}      Acquired lock or null if acquisition failed
   */
  async acquire(key, opts) {
    if (!key) throw new Q.Errors.InvalidArgumentError('Can not acquire lock. `key` can not be null')
    if (!opts) opts = {}
    if (typeof opts === 'string') {
      let configPrefix = opts
      opts = {
        timeout: await Q.config.get(`${configPrefix}.timeout`, 10000),
        retries: await Q.config.get(`${configPrefix}.retries`, 0),
        delay: await Q.config.get(`${configPrefix}.delay`, 50)
      }
    } else if (typeof opts !== 'object') {
      throw new Q.Errors.InvalidArgumentError('Invalid argument type', {
        expectedType: 'string|object',
        actualType: typeof opts,
        actualValue: opts
      })
    }

    let lock = this.redisLock.createLock(this.redis, opts)
    await lock.acquire(key).catch(this.LockAcquisitionError, (err) => {
      this.log.trace({ err, key }, 'Unable to acquire lock')
      lock = null
    })
    return lock
  }

  /**
   * async releaseAll - Releases all acquired locks
   *
   * @return {Void}
   */
  async releaseAll() {
    return Promise.map(
      this.redisLock.getAcquiredLocks(),
      _ => _.release()
    )
  }
}
