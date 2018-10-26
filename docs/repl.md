# REPL

REPL can be run using:

```sh
node app.js repl
```

REPL is wrapped in an immediately invoked async function so you can freely use `await` in the global scope.

## HTTP Server

By default when launched in REPL mode, quadro will load all controllers,
but will not start listening on the HTTP port.

If you want to force HTTP server in REPL mode, use:

```sh
QUADRO_HTTP_FORCE=true node app.js repl
```
