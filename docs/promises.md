# Promises

Quadro overrides default `Promise` implementation by that of `bluebird`.

## Helper method

```js
// Use:
const Redis = requirep('redis')

// instead of
const Redis = Promise.promiseifyAll(require('redis'))
```
