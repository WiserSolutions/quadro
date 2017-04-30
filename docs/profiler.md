# Profiler

## Examples

Basic usage:

```js
Q.profiler.profile('Do something', async function() {
  await Promise.delay(50)
})
// will write a trace message:
// 22:04:28:526   Do something - finished in 51 ms
```

Usage with parameters:

```js
Q.profiler.profile({ some_key: 'some_value' }, 'Do something', async function() {
  await Promise.delay(50)
})
// will write a trace message:
// 22:04:28:526   Do something - finished in 51 ms ( some_key: some_value )
```
