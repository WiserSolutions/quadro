# Redis

Quadro uses https://github.com/NodeRedis/node_redis .

DI name: `redis`.

## Configuration

You can pass the redis connection options in `quadro.redis` configuration namespace.
Those options are provided "as-is" to redis client upon initialization, which means
it has the same format as redis client [options](https://github.com/NodeRedis/node_redis#options-object-properties)

## Promises

The injected client is already promisified. And thus can be used with `yield`
and `await`.

## Example

```js
module.exports = async function(redis) {
  await redis.setAsync('hello', 'world')
}
```
