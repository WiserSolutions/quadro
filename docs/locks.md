# Quadro locks

Quadro uses `redis` and `redislock` as the distributed locking mechanism.

To be able to acquire locks use the `lockFactory` dependency.

## API

### .acquire(key, opts)

Acquires lock for key `key` and uses opts for lock [settings](https://github.com/danielstjules/redislock#overview).

**Returns** the lock object if succeeded, otherwise returns `null`

Example:

```js
let Lock = await Q.container.getAsync('lockFactory')
let lock = await Lock.acquire('some_key', {
  timeout: 2000,        // default: 10 sec
  retries: 3,           // default: 0
  delay: 100            // default: 50 ms
})
```

If `opts` is a string - it is used as the configuration key prefix.

Example:

```js
let Lock = await Q.container.getAsync('lockFactory')


let lock = await Lock.acquire('my_worker_key', 'workers.my')
// The above line is the same as:
let lock = await Lock.acquire('my_worker_key', {
  timeout: await Q.config.get('workers.my.timeout'),
  retries: await Q.config.get('workers.my.retries'),
  delay: await Q.config.get('workers.my.delay')
})
```

### .releaseAll()

**Use with caution!!!** Releases all acquired locks. Intended only for tests

## Lock instance

### Lock.release()

```js
let lock = await Lock.acquire('my_lock_key')

await lock.release()
```
