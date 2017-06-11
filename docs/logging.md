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
