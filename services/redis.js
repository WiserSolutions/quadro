const redis = require('redis')
Promise.promisifyAll(redis.RedisClient.prototype)
Promise.promisifyAll(redis.Multi.prototype)

module.exports = async function(config, log, container) {
  let redisConfig = config.get('quadro.redis', {})
  log.debug('Connecting to redis')
  let client = redis.createClient(redisConfig)
  client.on('error', (err) => log.error({ err }, 'REDIS ERROR'))
  await new Promise(function(resolve, reject) {
    client.on('ready', function() {
      log.debug('Connected to Redis')
      resolve(client)
    })
  })
  return client
}
