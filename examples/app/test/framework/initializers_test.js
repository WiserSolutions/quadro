/* eslint no-unused-expressions: 0 */
describe('initializers', function() {
  it('run the initilizer', async function() {
    expect(global.enabledInitializerVar).to.be.true
  })

  it('don\'t run the initilizer', async function() {
    expect(global.disabledInitializerVar).to.be.undefined
  })
})
