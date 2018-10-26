module.exports = class {
  constructor() {
    this.counter = 0
  }

  increment() {
    this.counter++
  }
}

module.exports['@aliases'] = ['my-alias']
