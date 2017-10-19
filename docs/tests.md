# Testing

Mask for tests is `test/**/*_test.js`

## Execution

To run quadro app in test mode use:

```sh
node app.js test [--watch]
```

```sh
./node_modules/mocha/bin/_mocha ./node_modules/quadro/lib/test/jest_config.js --ui tdd test/**/*_test.js
```

*NOTE:* You can use `--watch` flag to monitor the filesystem and restart tests
on change.

## Included matchers

- chai
- chai-subset

## Sinon

Quadro supports sinon sandboxing:

```js
it('works', function() {
  // This stub will be automatically restored after the test finishes
  // (note the usage of **this**.sinon)
  this.sinon.stub(Q.log, 'trace')
    .callsFake(() => console.log(...args))
})
```

### Sinon custom matchers

#### sinon.match.containSubset(...)

```js
it('works', function() {
  let spy = this.sinon.spy()
  spy({ a: 1, b: 2 })
  expect(spy).to.be.calledWith(this.sinon.match.containSubset({ a: 1 }))
  expect(spy).to.not.be.calledWith(this.sinon.match.containSubset({ c: 3 }))
})
```
