# StatsD Client

Quadro uses https://github.com/msiebuhr/node-statsd-client .

The client is injected as `stats`.

It has `redis` dependency.

# Example

```js
module.exports = function(stats) {
  stats.increment('usage')
}
```
