# External APIS

Quadro provides built-in support for external API calls.

## Usage

```js
const api = Q.externalAPI.register('orders', {
  // The host name
  host: 'orders.mycompany.com',
  // API timeout in milliseconds
  timeout: 1000,

  // Default: no retry
  retry: {
    // How many times to retry
    times: 5,
    // Strategy to use:
    // fib | fibonacci - to use fibonacci backoff
    // Default: exponential backoff
    strategy: 'fib|fibonacci|exp|exponential',
    // Interval before first retry
    // Further intervals will be computed based on the selected strategy
    startInterval: 100
  }
})

// Can be used either through the returned instance
const order = await api.get('/orders/1')
// or through the Q.externalAPI namespace
const order = await Q.externalAPI.orders.get('/orders/1')

// Supported REST methods:
api.get('/orders/1', { invalidateCache: true })
api.post('/orders', { id: 123, customerId: 'cstm_1' })
api.delete('/orders/1', ...)
api.put('/orders/1', { id: 123, customerId: 'cstm_2' })

// Custom requests are also Supported
// see https://github.com/request/request#requestoptions-callback for options

api.request('/some/custom/route', {
  method: 'options',
  auth: { user: 'me', pass: 'p@$$w0rd' }
})
```

## Configuration

External APIs can be registered from configuration.
Config namespace is `external_api`.

### Example:

```yml
# external_api.yml
svc1:
  host: my_service.mycompany.com:2222
```

Can later be used in code as follows:

```js
const response = await Q.externalAPI.svc1.get('/resource/123')
...
```

## Metrics

## quadro.external_api.retries

Specifies number of retries performed in a call.

Tags:
  outcome - success|failure
  source - Q.app.name
  target - name of the external api (as specified during registration)

## quadro.external_api.calls

Number of calls

Tags:
  source - Q.app.name
  target - name of the external api (as specified during registration)
  outcome - success|failure

## quadro.external_api.response_time

Response time for a single API call

Tags:
  source - Q.app.name
  target - name of the external api (as specified during registration)
  outcome - success|failure

## quadro.external_api.total_time

Total time taken to receive response or to finally fail
(including retries and backoffs)

Tags:
  source - Q.app.name
  target - name of the external api (as specified during registration)
  outcome - success|failure

## Notes

- All API calls default to JSON
- It is assumed that the second argument for `post` and `put` is a JSON serializable object
- For `get` and `delete` methods second argument is expected to be an object and is transformed to query string

## Known issues

- All APIs are assumed to be `http` (`https` not yet supported)
- Configured timeouts/retries apply to all requests to the API
