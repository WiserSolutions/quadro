# StatsD Client

Quadro uses [node-statsd-client](https://github.com/msiebuhr/node-statsd-client).

The client is injected as `stats`.

It has `redis` dependency.

# Example

```js
module.exports = function(stats) {
  stats.increment('usage')
}
```

## Config Example

The configuration for StatsD is in the `quadro.yaml` config file:

```yaml
statsd:
  host: statsd_host.com
  port: 8125 # Optional, default 8125
  protocol: tcp # Optional
  prefix: some_prefix # Optional, default is the app name
  tags: # Optional
    some: global_tag
    another: tag
```
