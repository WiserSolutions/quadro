<a name="0.9.0"></a>
# 0.9.0 (2018-03-19)


### Bug Fixes

* **ci:** do not release feature branches ([faafe32](https://github.com/WisePricer/quadro/commit/faafe32))


### Features

* **CI:** migrate CI publishing from V1 beta ([308a748](https://github.com/WisePricer/quadro/commit/308a748))
* **docker:** add release-it to base image ([ee0baf5](https://github.com/WisePricer/quadro/commit/ee0baf5))
* **docker:** added conventional-changelog-cli to base image ([2464429](https://github.com/WisePricer/quadro/commit/2464429))
* **docker:** upgrade base image to node latest ([57c4192](https://github.com/WisePricer/quadro/commit/57c4192))



<a name="0.8.0"></a>
# 0.8.0 (2018-03-19)


### Features

* **CI:** migrate CI publishing from V1 beta ([a0bf522](https://github.com/WisePricer/quadro/commit/a0bf522))
* **docker:** add release-it to base image ([32653b5](https://github.com/WisePricer/quadro/commit/32653b5))
* **docker:** added conventional-changelog-cli to base image ([55121e4](https://github.com/WisePricer/quadro/commit/55121e4))
* **docker:** upgrade base image to node latest ([fe53744](https://github.com/WisePricer/quadro/commit/fe53744))




## 0.7.11
- Fix: Connection close while sending message through pubsub

## 0.7.10
- Fix: Replaced espree with babel-eslint to support latest ecmaScript syntax
[Example](https://github.com/eslint/espree/issues/116)
- Fixed multi-host mongo connection string parsing
- Other dependencies upgraded (minor versions)

## 0.7.9
- Hotfix: make published messages persistent

## 0.7.8
- Added synchronous API wrappers ([Q.externalAPI](./docs/external_apis))

## 0.7.7
- critical bugfix: message handlers not registered in rabbitmq consumer pipeline

## 0.7.6
- Add CodeClimate code coverage to CircleCI
- Implement `versionRetreiver` service and `/_version` API
- ESLint fixes
- Upgraded dependencies
  - Upgraded MongoClient (+ introduced mongoConnectionFactory)
- Load message handlers from subfolders of `handlers`

## 0.7.5
- Support for `prefix` and `global tags` in StatsD configuration
- Handle handler not fond gracefully in pubsub

## 0.7.4
- Support for `willRetry` method in pubsub

## 0.7.3
- Independent test loader (see Tests.md)
- Document `repository` access through `model` (+ unit test)
- Added event hooks before and after http_server adds routes

## 0.7.2

- Fix failure on empty options in `run(opts)` call
- Allow specifying db fields mapping to bypass default inflection
- Allow specifying custom collection/table name
- Allow as_is field <-> attribute mapping
- bugfix: models loaded from db should not be `dirty`
- Add `destroyAll` resource method for HTTP `DELETE /resources`

## 0.7.0

- Pubsub: ignore message functionality (`ctx.ignore(statusMsg)`)
- Pubsub: message handling docs
- Nested errors
- tests: fix empty error names in `.to.be.instanceof(...)`
- Implemented plugins support
- odbm: Implemented isNew()
- odbm: Support for custom ids

## 0.6.21

- Allow service concurrency to be a string (will be parseInt'd)
- Support many inserts in `create`

## 0.6.20

- pubsub-pull: bugfix: don't count `retryAfterSec` as a failure

## 0.6.19

- pubsub-pull: Implemented `ctx.retryAfterSec`

## 0.6.18

- ODBM Bug fix: `update` of existing model
- Added test for saving a new record
- Upgraded sinon to 3.x

## 0.6.17

- Support for node v8.4.0
- Upgraded dependencies
- Support config overrides from environment variables
- Pubsub-pull: retrySchedule: set retries frequency via config
- ODBM: added `findOne` and `findOrBuild` functions

## 0.6.16

- Pubsub-pull: message format validation
- Pubsub-pull: scheduled message format fix

## 0.6.15

- Fixed service registration logging
- Added ability to pull messages from hub

## 0.6.14
- Support query in `deleteAll`
- Add `count` for count with/without query

## 0.6.13

- Fixed AR instance methods generation
- Dependencies update
- Removed custom AWS `quadro.aws.profile` configuration. Rely on standard AWS SDK credentials resolving

## 0.6.12

- Revert chai-as-promised to upstream version
- Fix docker image to work with node 8
- Upgrade dependencies

## 0.6.11

- Add forever agent to service hub calls

## 0.6.10

- `QuadroStream`: add support for sets and maps
- `sinon.match.containSubset()` sinon matcher
- Moved *sinon* tests to `test_framework_test.js`

## 0.6.9

- Workaround the chai-as-promised w/chai-4.0 issue
- Fix job crash on error

## 0.6.8

- Moved http, framework and services tests to respective directories
- Added `inflector` service
- Upgraded chai to v4.0
- Upgraded bunyan-logstash-tcp to v1.0
- Upgraded statsd-client to v0.3.0
- Implementation of Model base class with `Q.Model` helper
- Implementation of Repository class
- Increase timeout for DynamoDBConfigProvider test
- Implemented ActiveRecord API for models
- Fixed circleci config to include mongo
- Added mongo client service
- Fixed DI issue when running `nyc` for coverage
- Faster CircleCI tests - thanks to custom built base docker image

## 0.6.7

- Added support for `await` in REPL

## 0.6.6

- Implemented REPL (#129)
- Make sure initializers finished running before continuing application execution
- Write EventEmitter doc (#133)
- When a profiler-wrapped function throws an error - the error should bubble up

## 0.6.5

- Implemented async EventEmitter
- Unhandled rejections and general application errors will use `Q.log` if available

## 0.6.4

- removed co-mocha dependency
- initializers Ability to skip initializers during test phase

## 0.6.3

- bunyan QuadroStream (dev log) bugfixes

## 0.6.2

- Development log (shorter, prettier)
- Profiler (Q.profiler)
- Updated docs for namespace dependencies and healthcheck customization

## 0.6.1

- Services: Implemented nested services
- DI: Implemented healthcheck endpoint customization
- DI: Implemented namespaced dependencies resolving

## 0.6.0

- Implemented ad-hoc dependencies in DI container

## 0.5.17

- Implemented NotImplementedError
- Error name is now shown in logs `#110`
- Application bootstrap stops on initializer failure `#109`

## 0.5.16

- Added container.try[Async] methods
- Implemented healthcheck support

## 0.5.15

- Implemented `lockFactory` for distributed locks (using redis)
- Refactored index.js

## 0.5.14

- Update dependencies

## 0.5.13

- Tasks support
- Jobs documentation
- Changelog file
- Added the MIT license
