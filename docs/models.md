# Models

Quadro at the moment does not support ORM frameworks. However it does provide a notion of model.

You put your models in the `/models` directory. They are being registered during startup under the `Q.Models` namespace.

So if you have `models/user_permission.js`, you can access it through `Q.Models.UserPermission`.

*Note:* model names are pascal-cased.

## DI

Models themselves are not automatically registered, but the `Q.Models` namespace is.

Example:

```js
model.exports = function(models) {
  models.UserPermission.find //...
}
```
