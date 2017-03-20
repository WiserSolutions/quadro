# HTTP

## Directory layout

You should place your controllers in `/controllers` and route definitions in
`/routes`.

*Example:*

```js
// /routes/orders.js
module.exports = function(router) {
  router.resource('/orders', 'orders')
  // same as
  router.resource('orders')
}
```

```js
// /controllers/orders_controller.js
module.exports = class {
  async show(ctx) {
    // ...
  }
}

```

*NOTE:* Controllers should have `_controller` suffix

*NOTE:* The above example will only register `GET /orders/:id` route as the controller
has only `show` action
