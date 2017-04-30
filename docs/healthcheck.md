# Healthcheck

Quadro exposes a healthcheck endpoint at `/healthcheck`, which by default
returns `200`.

To add custom checks to the healthcheck create a service called `healthcheck` with
the `run` method.

The `run` method will be run during each healthcheck. This method can return:

- true - healthcheck succeeds with 200
- false - healthcheck fails with 500
- exception thrown - healthceck fails with 500 and body `{ error: { message, extra } }`

Example:

```js
// services/healthcheck.js
module.exports = class {
  constructor(redis) {
    this.redis = redis
  }

  run() {
    await this.redis.ping()
    return true
  }
}
```

## Custom endpoint

You can override healthcheck endpoint with `quadro.http.healthcheck.endpoint`:

```yaml
# quadro.yml
quadro:
  http:
    healthcheck:
      endpoint: '/alive'
```
