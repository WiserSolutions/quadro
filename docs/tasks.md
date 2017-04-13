# Quadro tasks

Quadro allows you to run one-off tasks from the command line.

```sh
node app.js task demo
```

The command above will execute the file `tasks/demo.js` within the application context
and immediately terminate.

It is very similar to *rake tasks*.

That is cool because you can just a task as easy as:

```js
// tasks/demo.js
module.exports = async function(log, server) {
  let serverStatus = await server.getStatus()
  log.info({ serverStatus }, 'Current server status')
}
```

**NOTE** all the dependencies are injected into the task, so you can do
whatever business logic you want within it.
