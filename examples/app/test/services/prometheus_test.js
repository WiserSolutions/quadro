/* eslint-disable no-unused-expressions */
describe('Prometheus Service', () => {
  it('exists', async () => {
    const prom = await Q.container.getAsync('prometheus')
    expect(prom).is.not.null
  })
})
