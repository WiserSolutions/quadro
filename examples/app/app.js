const Quadro = require('quadro')
Quadro({
  plugins: [
    '../plugin',
    { name: 'quadro-test', condition: () => Q.app.isTestEnv }
  ]
})
