/* eslint-disable no-unused-expressions */
describe.only('Mongo Service', () => {
  it('exists', async () => {
    const mongo = await Q.container.getAsync('mongo')
    expect(await mongo.collections()).to.not.be.empty
  })

  it('records to prometheus', async function testMongo() {
    const mongo = await Q.container.getAsync('mongo')
    const collection = mongo.collection('locations_config')
    expect(await collection.countDocuments({})).to.be.gt(0)
    const prom = await Q.container.getAsync('prometheus')
    const pattern = /^mongodb_query_count{.*?function="Context\.testMongo".*?operation="countDocuments".*} 1/
    expect(prom.register.metrics().split('\n').filter(i => pattern.test(i))).to.be.length(1)
  })
})
