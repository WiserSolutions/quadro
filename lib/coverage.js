// if (process.env.QUADRO_COVER) {
  let NYC = require('nyc')
  global.coverage = new NYC({
    // cwd: require('path').resolve(process.cwd(), '../../'),
    // include: ['**/*.js'],
    // reporter: ['text-summary', 'html']
  })
  global.coverage.reset()

  global.coverage.addAllFiles()
// }
