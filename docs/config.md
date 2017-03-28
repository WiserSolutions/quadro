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
