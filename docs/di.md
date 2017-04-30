# Dependency Injection (DI)

Quadro heavily utilizes dependency injection. DI is done via constructor arguments:

```js
function(config) {
  // Use `config` here
}
```

## Lifetimes

Quadro supports 2 dependency lifetimes:

`singleton` - only one instance of the dependency will be created. All consumers of this dependency will receive the same instance.

`transient` (default) - On each resolution a new instance will be created for `class` registrations, and a new invocation will be done for `factory` registrations.

## Registration types <a name="registration_types"></a>

Registration types affect object instantiation. Quadro DI supports 3 registration types:

`class` instantiates the dependency on each resolution.

`factory` on each resolution the dependency is being run and the result is return

`value` on each resolution the object passed as the dependency will be returned.

```js
function foo() { return 12 }

// When registered as `class` - an instance of foo will be returned
Q.container.register('foo', foo, { type: 'class' })
Q.container.get('foo') instanceof foo // true
Q.container.get('foo') === 12 // false


// When registered as `factory` - the number 12 will be returned
Q.container.register('foo', foo, { type: 'factory' })
Q.container.get('foo') instanceof foo // false
Q.container.get('foo') === 12 // true


// When registered as `value` - the foo function itself will be returned
Q.container.register('foo', foo, { type: 'value' })
Q.container.get('foo') === foo  // true
Q.container.get('foo') instanceof foo // false
Q.container.get('foo') === 12 // false
```

## Namespaces

You can register dependencies under custom namespaces.

Example:

```js
Q.container.register('myNamespace:svc', function() {})

// You can request namespaced dependencies with `default parameter` notation:
Q.container.run(function(svc = 'myNamespace:svc') {
  let result = svc()  // Use the dependency
})
```

## API

### container.register(name, dependency, options)

Registers a dependency in the container.

`name` - the name to use when resolving the dependency.

`dependency` - the dependency to register. Can be a `class`, `function`, `object`, or a scalar value.

`options.type` - [type of registration](#registration_types)

#### container.get[Async] (name)

Returns a dependency registered as `name`.

**Note** If the dependency is asynchronous (has an async `initialize` method), or is dependent on asynchronous dependency - you should use `.getAsync`.

**Note** Using `.get` on asynchronous dependencies will throw an error

Example:

```js
// Get synchronous dependency
let log = Q.container.get('log')

// Get async dependency
let redis = await Q.container.getAsync('redis')
```

#### container.try[Async] (name)

Works like `container.get[Async]`, but returns null if the dependency is not
registered (in contrast with `.get[Async]` which will throw an exception)

#### container.create(obj, opts)

**Alias:** container.run

Runs a function or creates a class, while resolving its dependencies.
Use it when you need to run a function, instantiate a class instance that is not registered.

Example:

```js
// Using class
class StatsReporter {
  // Assuming `stats` is registered
  constructor(stats) { }

  async generateReport() { }
}

let reporter = await Q.container.create(StatsReporter)
await reporter.generateReport()
```

```js
// Using method

// Assuming `stats` is registered
async function generateReport(stats) {
  // ...  
}

// Will run generateReport and pass the `stats` dependency to it
await Q.container.run(generateReport)
```

```js
// Using `opts.args` for ad-hoc dependencies

function square(value) { value * value }
Q.container.run(square)
// Throws `value` can not be resolved

Q.container.run(square, { args: { value: 3 } })
// Returns 9
```


#### container.find(pattern)

Lists all dependencies matching `pattern`.

Example:

```js
// Get list of all dependencies within the `services` namespace
let services = Q.container.find(/^services\:/)
```

## Services

Everything under `services/` is automatically registered as singleton.

Example:

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

### 'services'  namespace

All service registrations are also aliased under the `services:` namespace. So for `services/db.js` we'll have 2 entries in the container - `db` and `services:db`

## Available framework registrations

- stats (statsd client)
- config (config accessor object)
- log
- pubsub
- koa - koa app
- httpServer - HttpServer instance which koa app is using
- app - quadro app instance
- aws
- container - DI container for `ServiceLocator` pattern (manually locating registered dependencies)
