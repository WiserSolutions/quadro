module.exports = function Profiler() {
  this.profile = async function(data, message, func) {
    if (typeof message === 'function') func = message
    if (typeof data === 'string') {
      message = data
      data = {}
    }
    let start = Date.now()
    try {
      await func()
      Q.log.trace(data, `${message} - finished in ${this.elapsedTime(start)}`)
    } catch (err) {
      Q.log.trace(data, `${message} - failed in ${this.elapsedTime(start)}`)
      throw err
    }
  }

  this.elapsedTime = function(start) {
    let elapsed = Date.now() - start
    return `${elapsed} ms`
  }
}
