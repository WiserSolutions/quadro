# Cache

Quadro has the `cache` dependency, implemented using `redis`.

## API

To set cache value use:

```js
async function(cache) {
  await cache.set('some_key', 123)
}
```

To get cache value use:

```js
async function(cache) {
  await cache.get('some_key')
}
```
