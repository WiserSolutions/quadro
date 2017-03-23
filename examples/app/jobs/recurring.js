let counter = 0

module.exports = class {
  async run() {
    counter += 3
  }

  getCounter() {
    return counter
  }
}

module.exports['@interval'] = 0.05
