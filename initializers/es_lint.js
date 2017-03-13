module.exports = async function(app, log) {
  if (app.env === 'production') return

  log.trace('Running ESLint')

  let CLIEngine = require('eslint').CLIEngine
  let cli = new CLIEngine({
    ignorePath: require('path').resolve(__dirname, '../.eslintignore')
  })
  let report = cli.executeOnFiles([app.appDir])
  let formatter = cli.getFormatter('compact')
  console.log(formatter(report.results))
}
