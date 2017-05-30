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

## Model API

### model.build(attrs)

Instantiates a model and populates the attributes from the provided `attrs` object.

*Note:* The model is considered *dirty* after the `build` method invocation

### model.create(attrs)

Like `model.build`, but also persists the record.

*Note:* In contrast with `.build` method, `.create` returns a non-dirty model.

### model.save()

Persists the changed fields of the model. The model is upserted into the db -
if the record has no id - it is inserted, otherwise - updated.

### model.destroy()

Removes the model from the DB

## Repositories
