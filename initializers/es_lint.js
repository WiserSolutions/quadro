module.exports = async function(app, log, config) {
  if (app.env === 'production') return

  log.trace('Running ESLint')

  require('eslint-plugin-standard')
  require('eslint-plugin-promise')
  require('eslint-config-standard')

  let eslintIgnoreFile = await app.glob('.eslintignore', { dirs: ['app', 'quadro'] })
  let eslintrcFile = await app.glob('.eslintrc', { dirs: ['app', 'quadro'] })

  let CLIEngine = require('eslint').CLIEngine
  let cli = new CLIEngine({
    ignorePath: eslintIgnoreFile[0],
    configFile: eslintrcFile[0]
  })
  let report = cli.executeOnFiles([app.appDir])
  let formatter = cli.getFormatter('compact')
  console.log(formatter(report.results))
}
