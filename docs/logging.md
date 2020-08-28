# Logging

Quadro uses [bunyan](https://github.com/trentm/node-bunyan) logger.

It is accessible as dependency `log`. Or through the `Q` namespace, as: `Q.log`.

## WARNING!!! Do not use the `name` field in your logs

Bunyan (the underlying logging library) has a special treatment for the `name`
attribute.

The development logger (QuadroLogger) omits the `name` attribute.

## Custom serializers

Quadro registers all [standard bunyan serializers](https://github.com/trentm/node-bunyan#standard-serializers). You can register your custom serializers in an initializer:

```js
// initializers/logging.js
module.exports = function(logger) {
  logger.addSerializers({ token: serializer })
}
```

## Q.log API

`Q.log` exposes the following methods which directly correspond to bunyan calls:

```js
Q.log.trace(...)
Q.log.debug(...)
Q.log.info(...)
Q.log.warn(...)
Q.log.error(...)
```

In addition `Q.log` exposes:

```js
Q.log.audit(action, object, status, { group, extra } = {})
Q.log.metric(name, dimensions, values)
Q.log.event(type, content)
```

## Configuration
`quadro.logger.logstash` - Set a custom logstash URL
`quadro.logger.noFileLogging` - Disable file logging, will cause Quadro to only log to stdout.
