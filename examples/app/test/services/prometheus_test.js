/* eslint-disable no-unused-expressions */
const http = require('http')

describe('Prometheus Service', () => {
  it('exists', async () => {
    const prom = await Q.container.getAsync('prometheus')
    expect(prom).is.not.null
  })

  it('launches webserver', (callback) => {
    http.get({url: 'http://localhost/metrics', port: 9230}, (res) => {
      expect(res.statusCode).to.equal(200)
      expect(res.body).to.contain('quadro_process_cpu_user_seconds_total')
      callback()
    })
  })
})
