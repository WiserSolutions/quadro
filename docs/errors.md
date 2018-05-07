# Custom Errors in Quadro

Quadro exposes the `Q.Errors` namespace which hosts all the errors and 1 utility function to declare a new error type.

```js
// There are a couple of ways to declare an error

const MyError = Q.Errors.declare('MyError')

// The following example throws the error above
try {
  throw new MyError('something bad happened', { param: 123 })
  // Or
  throw new Q.Errors.MyError('something bad happened', { param: 123 })
} catch (err) {
  console.log(err.message)      // something bad happened
  console.log(err.extra)        // { param: 123 }
}

// Default message
Q.Errors.declare('MyError', 'something bad happened')  
try {
  throw new Q.Errors.MyError()
} catch (err) {
  console.log(err.message)  // something bad happened
}

// Add extra params while keeping default message
throw new Q.Errors.MyError({ param: 123 })

// Overriding message
throw new Q.Errors.MyError('overridden message')

// Parameters order for message, extra params, and nested errors does not matter
throw new Q.Errors.MyError({ param: 123 }, 'overridden message', err)

// Default extra params
Q.Errors.declare('RetriableError', { retry: true })

// Merge/override default extra params
throw new Q.Errors.RetriableError('failed', { retry: false, code: 'TIMEOUT' })

// Specify base class
Q.Errors.declare('SpecificValidationError', Q.Errors.ValidationError)

// Specify nested errors
try {
  require('fs').readFileSync('...')
} catch (err) {
  throw new Q.Errors.MyError(err, { code: err.code })
}

// NOTE: As Quadro uses Bluebird for promises, you can also do the following:
someAsyncFunction()
  .catch(Q.Errors.MyCustomError, ...)

// `instanceof` type checking
try {
  throw new Q.Errors.MyCustomError(/* ... */)
} catch (err) {
  if (err instanceof Q.Errors.MyCustomError) {
    // ...
  }
}
```
