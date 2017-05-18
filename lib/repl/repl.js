const repl = require('repl')
const { addAwaitOutsideToReplServer } = require('await-outside')

addAwaitOutsideToReplServer(repl.start({ prompt: '> ' }))
