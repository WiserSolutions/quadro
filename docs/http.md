# HTTP

## Directory layout

You should place your controllers in `/controllers` and route definitions in
`/routes`.

## Routes

### Resources

You register a resource with:

```js
module.exports = function(router) {
  router.resource('orders')
}
```

#### Resources mapping

Resource actions are mapped as follows to url paths:

| action  | method | path
|---------|--------|-----
| index   | GET    | /resource
| show    | GET    | /resource/**:id**
| create  | POST   | /resource
| update  | PUT    | /resource/**:id**
| destroy | DELETE | /resource/**:id**

#### Example

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

*NOTE:* `.resource()` only registers REST paths that are handled by the controller.
In the example above - the controller has only `show` method - and thus will have
only `GET /orders/:id` registered

## Controllers

Controllers should be placed in `/controllers` directory and have `_controller`
suffix.
