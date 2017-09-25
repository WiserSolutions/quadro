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

## ActiveRecord

### Basics

To define an AR model you use:

```js
// models/user.js
module.exports = Q.Model('user', {
  attributes: {
    name: 'string',

    // Specify `physicalName` to override default generated db field name
    type: { physicalName: 'category' }
  }
})
```

### Identity

Each model is assumed to have an identity attribute called `id`. The backing
field in the actual storage might vary (e.g. `_id` for mongo).


### Adapters

Support for different storage backends is implemented through adapters.

### ActiveRecord API

```js
const User = Q.Model('user', {
  attributes: {
    firstName: 'string',          // Shortcut for { type: 'string' }
    lastName: { type: 'string' }
  }
})

let user = new User({ firstName: 'John' })

// Custom ids are also supported
let user2 = new User({ id: 'George' })

// Save the model
await user.save()
// After `.save` the model will have it's id populated
expect(user.id).to.be.ok

// Access the attributes via:
user.firstName = 'Johnny'
user.lastName = 'Depp'
user.save()
```

#### Raw attribute accessors:

You can get/set attributes not specified within the `attributes` section:

```js
user._setAttr('hiddenAttribute', '123123123')
user._getAttr('hiddenAttribute') // => '123123123'
```

## Model API

### model.build(attrs)

Instantiates a model and populates the attributes from the provided `attrs` object.

*Note:* The model is considered *dirty* after the `build` method invocation

### model.create(attrs)

Like `model.build`, but also persists the record.

`attrs` may also be an array to create multiple models.

*Note:* In contrast with `.build` method, `.create` returns a non-dirty model.

### model.save()

Persists the changed fields of the model.

The model is upserted into the db - if the record has no id - it is inserted,
otherwise - updated.
In both cases the id is set on the model after this call.


### model.destroy()

Removes the model from the DB


### model.find(query)

Get the matched entities from the DB


### model.count()

Get count of all entities matched to given query


### model.changes()

Returns an object containing the changed attributes. Format:

### model.deleteAll(query)

Remove from the DB by given query. If query not provided, will remove all entities.


```js
{
  firstName: { current: 'Johnny', old: 'John' },
  lastName: { current: 'Depp', old: 'Kennedy' },
}
```
