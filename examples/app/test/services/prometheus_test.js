/* eslint-disable no-unused-expressions */
const http = require('http')

describe('Prometheus Service', () => {
  it('exists', async () => {
    const prom = await Q.container.getAsync('prometheus')
    expect(prom).is.not.null
  })

  it('launches webserver', async () => {
    const body = await new Promise((resolve, reject) => {
      http.get('http://localhost:9230/metrics', (res) => {
        expect(res.statusCode).to.equal(200)
        res.setEncoding('utf8')
        let body = ''
        res.on('data', d => body += d)
        res.on('end', () => resolve(body))
      }).on('error', reject)
    })

    expect(body).to.contain('quadro_process_cpu_user_seconds_total')
  })
})
