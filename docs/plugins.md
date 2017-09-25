# Quadro Plugins

## What is a plugin?

A quadro plugin is a way to implement reusable modules. It looks exactly like
a quadro application (same directory structure).

## Usage

To use a plugin you need:

1. Install it

```sh
npm install some-quadro-plugin
```

2. Load it in you `app.js`

```js
const Quadro = require('quadro')
Quadro({
  plugins: ['some-quadro-plugin']
})
```

This will load all the configs, services, tasks and initializers from the plugin.

## Implementing a plugin

Like said above, a quadro plugin looks exactly like any other quadro application
with the following entities supported:

- Initializers
- Configs
- Tasks
- Services
- Controllers (TBD)
- Routes (TBD)

To create a plugin - just create a new package and create and add any required
services, configs, etc.

You can use the `Q` in services, tasks, etc.
**BUT** it can not be used in the default script (index.js), which is being ran
by `require`ing your plugin, but before the quadro application finished
initialization.

Examples:

```js
// index.js

console.log('Loading my awesome plugin') // Valid - quadro app functionality not being used here

Q.app.appDir // INVALID: quadro application not yet initialized when `index.js` is being run
```

```js
// services/some_service.js
module.exports = function(redis) {
  // Valid - you can use the redis dependency even if it is provided outside of
  // the plugin.

  redis...
}
```
