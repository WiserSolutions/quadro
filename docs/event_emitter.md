# EventEmitter

Quadro provides `Q.EventEmitter` for asynchronous event handlers:

```js
class Test extends Q.EventEmitter {
}

let test = new Test()

test.on('ev', (arg) => console.log('sync handler finished', arg))
test.on('ev', async (arg) => Promise.delay(100).then(_ => console.log('async handler finished', arg)))
```

You can run the handlers like the standard `EventEmitter` does:
```js
test.emit('ev', 123)
console.log('hello')
// Will output:
// sync handler finished 123
// hello
// async handler finished 123
```

Or you can wait until all handlers (including async) finished:

```js
test.emit('ev', 123)
console.log('hello')
// Will output:
// sync handler finished 123
// async handler finished 123
// hello
```
