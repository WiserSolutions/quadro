# Configuration

Quadro supports flexible configuration mechanism, which includes:

- Per-environment Configuration
- Configuration providers
- Local-system configuration (can be excluded from source control)

Configuration is exposed as `Q.config` or as `config` DI dependency.

## Directory layout

```
config
|- development/
| |- quadro.yml
| |- app.yml
|- test/
| |- ...
|- production/
| |- ...
|- local/
| |- app.yml
|- app.yml
|- quadro.yml
```

The above setup will expose 2 config namespaces:

```js
config.get('quadro.some_key.nested_key')
config.get('app.some_key.nested_key')
```

Quadro will merge the configuration in the following order (in priority order):

- config/local/namespace.yml
- config/NODE_ENV/namespace.yml
- config/namespace.yml

Configuration from `config/local` will override (via deep merge) configuration from `config/NODE_ENV`, which in turn will override configuration from `config/`.

**NOTE** Local configuration (from `config/local/`) is not evaluated in test mode!
The reason for this is that tests should be consistent across all environments.

### Excluding `local` configuration from version control

It is highly recommended that any config values that are tweaked during debugging/development
will be added to `local/` configs. This way you can add `**/config/local/` to `.gitignore`
and be able to keep your dev environment clean during commits/pushes.

You can maintain your local-machine specific configuration config/local.
For git to ignore those changes use:

```sh
git update-index --skip-worktree **/config/local/*
```

## API

### .get(path[, defaultValue])

Returns configuration stored under `path`. If no value is stored in the configuration under the specified `path` - the `defaultValue` will be returned

### .registerConfigRoot(namespace, provider)

Registers a customer configuration provider under `namespace`.

Example:

```js
function customProvider(key) {
  return key.toUpperCase()
}
Q.config.registerConfigRoot('upcase', customProvider)

Q.config.get('upcase.anyKey') // => ANYKEY
```

Read/write configuration providers:

```js
let settings = {}
let settingsProvider = {
  get: function(key) { return settings[key] }
  set: function(key, value) { settings[key] = value }
}
Q.config.registerConfigRoot('settings', settingsProvider)

// Then you can set settings
Q.config.set('settings.someThreshold', 5)
```

**NOTE** You can not set config values on the default config provider as they
are stored in files and setting them might be misleading when there are multiple machines
behind a load balancer.


## Configuration from environment variables

You can set config values from environment variables. Example:

```yaml
# cfg.yml
key: from_file
```

If you have `CFG_KEY` environment variable set to `from_env` then:

```js
Q.config.get('cfg.key')
```

will return `from_env` instead of `from_file`.

*Note:* `cfg.key1` should be defined as `CFG_KEY_1` environment variables (number
is separated with underscore)

## Configuration REST API

Quadro automatically exposes REST API to set and get configuration.

### Get configuration
Use the following to get a value for `some.key`:

```http
GET /config/some.key
```

Returns `200` with body:

```json
{ "value": 123 }
```

### Set configuration

```http
PUT /config/some.key
Content-Type: application/json

{ "value": 123 }
```

Returns `204` without content
