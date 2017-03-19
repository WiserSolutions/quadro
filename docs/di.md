# Dependency Injection (DI)

Quadro heavily utilizes dependency injection. DI is done via constructor arguments:

```js
function(config) {
  // Use `config` here
}
```

## Services

Services everything under `services/` is automatically registered as singleton, for example:

```js
// services/db.js
module.exports = function({ db } = config) {
  return new MongoClient(db)
}
```

Then you can use it as:

```js
module.exports = class SomeClass {
  constructor(db) {
    this.db = db
  }
}
```

## Available framework registrations

- stats (statsd client)
- config (config accessor object)
- log
- pubsub
- koa - koa app
- httpServer - HttpServer instance which koa app is using
- app - quadro app instance
- container - DI container for `ServiceLocator` pattern (manually locating registered dependencies)
