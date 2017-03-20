# Initializers

Initializers are located in `initializers/` folder and are executed
at application startup.

Example:

```js
// initializers/runtime.js
module.exports = class {
  constructor({ runtime: runtimeConfig } = config) {
    this.config = runtimeConfig
  }

  // ...
}
```
