# External APIS

Quadro provides built-in support for external API calls.

## Usage

```js
const api = Q.externalAPI.register('orders', {
  // The host name
  host: 'orders.mycompany.com',
  // API timeout in milliseconds
  timeout: 1000
})

// Can be used either through the returned instance
const order = await api.get('/orders/1')
// or through the Q.externalAPI namespace
const order = await Q.externalAPI.orders.api.get('/orders/1')

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

## Notes

- All API calls default to JSON
- It is assumed that the second argument for `post` and `put` is a JSON serializable object
- For `put` and `delete` methods second argument is expected to be an object and is transformed to query string

## Known issues

- All APIs are assumed to be `http` (`https` not yet supported)
- Configured timeouts/retries apply to all requests to the API
