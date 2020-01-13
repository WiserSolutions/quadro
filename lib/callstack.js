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
   * @note Unfuntatnely the exact answer is partially dependent on what version of node is in use.
   *  Older node versions (<v12) will name lambdas in the call stack, meaning the "caller" of
   *  ```
      function fn2() {
        return [0].map(() => { callstack.getCaller() })[0]
      }

      function fn1() {
        return fn2()
      }
      ```
   *  will be `fn2` on node <v12 and `fn1` on node >=v12.
   *
   * @return {Object} {name, file, line, column}
   */
  getCaller() {
    const FUNCTION_NAME = /^at ([\w.]+)/
    const ALIAS_NAME = /\[as ([\w.]+)\]/
    const FUNCTION_LOCATION = /([/\\-\w]+\.(?:\w+)):(\d+):(\d+)/
    let stack = new Error().stack
      .split('\n')
      .map(s => s.trim())
      .slice(2) // remove Error line and stack entry for this function
    console.log(stack)
    let foundThis = false // (caller of this function)
    for (const i of stack) {
      const m = FUNCTION_NAME.exec(i)
      if (!m) continue
      // aliases happen when a function is assigned to an object
      const alias = ALIAS_NAME.exec(i)
      const name = alias ? alias[1] : m[1]

      // make suere it is not a lib function such as Array.map or _.map
      const callerloc = FUNCTION_LOCATION.exec(i)
      if (!callerloc) continue // common failiure with `<anonymous>` for stdlib function
      const callerPath = parse(callerloc[1])

      const pathArray = callerPath.dir.split(sep)
      const isModuleFunction = pathArray.find(j => j === 'node_modules')
      const isQuadroFunction = pathArray.find(j => j === 'quadro')
      if (isModuleFunction && !isQuadroFunction) {
        // handle _.map and other module provided functions
        // but do not ignore funtions such as the mongo function wrappers provided by this lib
        continue
      }

      if (!foundThis) {
        // want the caller of this caller, so skip first result
        foundThis = true
        continue
      }

      // finally found the correct function
      return {name, file: callerPath.name, line: callerloc[2], column: callerloc[3]}
    }

    // failed to find function
    return {}
  }
}
