module.exports = class {
  constructor() {
    this._emitHandlers = {}
  }

  on(type, handler) {
    if (!this._emitHandlers[type]) this._emitHandlers[type] = []
    this._emitHandlers[type].push(handler)
  }

  async emit(type, params) {
    let handlers = this._emitHandlers[type]
    if (!handlers) return

    for (var handler of handlers) {
      let result = handler(params)
      if (result && result.then && typeof result.then === 'function') {
        await result
      }
    }
  }
}
