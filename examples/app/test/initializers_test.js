/* eslint no-unused-expressions: 0 */
describe('initializers', function() {
  it('initilizer ran', async function() {
    let value = await Q.container.getAsync('testVariable')
    expect(value).to.be.eql('test')
  })

  it('disabled initilizer didn\'t ran', async function() {
    await expect(Q.container.get('disabledTestVariable', {doNotThrow: true})).to.be.null
  })
})
