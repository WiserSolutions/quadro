const { parse, sep } = require('path')

module.exports = {
  /**
   * Get information about the function which called the current function.
   * (i.e. get the caller of the caller of this function)
   *
   * This will ignore unamed lambda functions and will attempt to ignore library functions such as
   * `_.map` or `Array.map` which simply call a function passed to them.
   *
   * On failure, it will return an empty object.
   *
   * @return {Object} {name, file, line, column}
   */
  getCaller() {
    const FUNCTION_NAME = /^at ([\w.]+) \(.+\)$/
    const FUNCTION_LOCATION = /([/\\-\w]+\.(?:\w+)):(\d+):(\d+)/
    let stack = new Error().stack
      .split('\n')
      .map(s => s.trim())
      .slice(2) // remove Error line and stack entry for this function
    let foundThis = false // (caller of this function)
    for (const i of stack) {
      const m = FUNCTION_NAME.exec(i)
      if (!m) continue
      const name = m[1]

      // make suere it is not a lib function such as Array.map or _.map
      const callerloc = FUNCTION_LOCATION.exec(i)
      if (!callerloc) continue // common failiure with `<anonymous>` for stdlib function
      const callerPath = parse(callerloc[1])
      const isModuleFunction = callerPath.dir
        .split(sep)
        .find(j => j === 'node_modules')
      if (isModuleFunction) continue // handle _.map and other module provided functions
      if (!foundThis) {
        // want the caller of this caller, so skip first result
        foundThis = true
        continue
      }
      return {name, file: callerPath.name, line: callerloc[2], column: callerloc[3]}
    }

    // failed to find function
    return {}
  }
}
