const redis = require('redis')
Promise.promisifyAll(redis.RedisClient.prototype)
Promise.promisifyAll(redis.Multi.prototype)

module.exports = async function(config, log, container) {
  let redisConfig = config.get('quadro.redis', {})
  log.debug('Connecting to redis')
  let client = redis.createClient(redisConfig)
  client.on('error', (err) => log.error({ err }, 'REDIS ERROR'))
  return new Promise(function(resolve, reject) {
    client.on('ready', function() {
      log.info('Connected to Redis')
      container.registerSingleton('redis', client, { type: 'object' })
      resolve(client)
    })
  })
}
