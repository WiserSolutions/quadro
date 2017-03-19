const path = require('path')

module.exports = async function(app, log) {
  if (app.env === 'production') return

  log.trace('Running ESLint')

  let CLIEngine = require('eslint').CLIEngine
  let cli = new CLIEngine({
    ignorePath: path.resolve(__dirname, '../.eslintignore'),
    configFile: path.resolve(__dirname, '../.eslintrc')
  })
  let report = cli.executeOnFiles([app.appDir])
  let formatter = cli.getFormatter('compact')
  console.log(formatter(report.results))
}
