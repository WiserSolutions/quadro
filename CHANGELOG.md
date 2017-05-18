# Changelog

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
