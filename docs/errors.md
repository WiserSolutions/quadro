# Custom Errors in Quadro

Quadro exposes the `Q.Errors` namespace which hosts all the errors and 1 utility function to declare a new erorr type.

```js
// There are a couple of ways to declare an error

const MyError = Q.Errors.declareError('MyError')

// The following example throws the error above
try {
  throw new MyError('something bad happened', { param: 123 })
  // Or
  throw new Q.Errors.MyError('something bad happened', { param: 123 })
} catch (err) {
  console.log(err.message)      // something bad happened
  console.log(err.extra)        // { param: 123 }
}

// You can specify default error message:
Q.Errors.declareError('MyError', 'something bad happened')  
try {
  throw new Q.Errors.MyError()
} catch (err) {
  console.log(err.message)  // something bad happened
}

// You can provide a custom initializer
Q.Errors.declareError('MyError', function() {
  this.foo = 'bar'
})
try {
  throw new Q.Errors.MyError()
} catch(err) {
  console.log(err.foo)      // 'bar'
}

// NOTE: As Quadro uses Bluebird for promises, you can also do the following:
someAsyncFunction()
  .catch(Q.Errors.MyCustomError, ...)

// When not in promises you can check for types of errors as:

try {
  throw new Q.Errors.MyCustomError(/* ... */)
} catch (err) {
  if (err instanceof Q.Errors.MyCustomError) {
    // ...
  }
}
```
