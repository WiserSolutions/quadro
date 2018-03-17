# Promises

Quadro overrides default `Promise` implementation by that of `bluebird`.

## Helper method

```js
// Use:
const Redis = requirep('redis')

// instead of
const Redis = Promise.promiseifyAll(require('redis'))
```

## Bluebird long stack traces and warnings

[Long stack traces](http://bluebirdjs.com/docs/features.html#long-stack-traces)
are enabled automatically for NODE_ENV=dev|development|test|<empty>
