# Quadro framework

TOC:

<!-- TOC depthFrom:1 depthTo:6 withLinks:1 updateOnSave:1 orderedList:0 -->

- [Quadro framework](#quadro-framework)
	- [Installation](#installation)
	- [Configuration manager](#configuration-manager)
	- [Tests runner](#tests-runner)
	- [HTTP Server](#http-server)
		- [HTTP port](#http-port)

<!-- /TOC -->

## Installation

Create a new app and add the following to package.json:

```json
"dependencies": {
  "quadro": ""
}
```

In `app.js` add:

```js
const Quadro = require('quadro')
Quadro()
```

You're done! Run with:

```sh
node app.js [--watch]
```

Test with:

```sh
node app.js test [--watch]
```

## Configuration manager

Config files should be placed in `ROOT/config/` dir.

To get value of `key.nestedKey` in configuration file named `config/someConfig.yml`:

```js
app.config.someConfig.key.nestedKey
```

For safe configuration fetch, use `config.get`:

```js
app.config.get('someConfig.key.nestedKey')
```

To get value of `key.nestedKey` in `config/someConfig.yml|yaml|js|json` and
defaults to `3000` if such key doesn't exist

```js
app.config.get('someConfig.key.nestedKey', 3000)
```

## Tests runner
To run tests use:

```sh
node app.js test
```

To make tests re-run on file changes use:

```sh
node app.js test --watch
```

## HTTP Server

### HTTP port

Use config value: `quadro.http.port`
Default: `3000`
