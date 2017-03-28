# Logging

Quadro uses [bunyan](https://github.com/trentm/node-bunyan) logger.

It is accessible as dependency `log`. Or through the `Q` namespace, as: `Q.log`.

## Custom serializers

Quadro registers all [standard bunyan serializers](https://github.com/trentm/node-bunyan#standard-serializers). You can register your custom serializers in an initializer:

```js
// initializers/logging.js
module.exports = function(logger) {
  logger.addSerializers({ token: serializer })
}
```
