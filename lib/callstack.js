const { parse, sep } = require('path')
const getStack = require('callsite')

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
    const stack = getStack().slice(1)
    let foundThis = false // (caller of this function)
    for (const i of stack) {
      const name = i.getMethodName() || i.getFunctionName()
      const file = i.getFileName()
      const line = i.getLineNumber()
      const column = i.getColumnNumber()

      // ignore unattached lambdas
      if (!name) continue

      // make suere it is not a lib function such as Array.map or _.map
      if (!file) continue // common failiure with `<anonymous>` for stdlib function
      const callerPath = parse(file)

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
      return {name, file, fileName: callerPath.name, line: line, column: column}
    }

    // failed to find function
    return {}
  }
}
