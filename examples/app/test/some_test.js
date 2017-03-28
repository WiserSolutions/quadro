describe('Hello', function() {
  it('works with async', async function() {
    expect(2).to.equal(2)
  })

  it('works with promises', async function() {
    let start = Date.now()
    await Promise.delay(100)
    expect(Date.now() - start).to.be.gte(99)
  })

  it('works with generators', function*() {
    let start = Date.now()
    yield Promise.delay(100)
    expect(Date.now() - start).to.be.gte(99)
  })

  // it('does not crash the process on test failure', function*() {
  //   log.info('In this test you should see a failure, but the process should not crash')
  //   expect(2).to.equal(1)
  // })

  it('supports sinon', function() {
    this.sinon.stub(Date, 'now').callsFake(_ => 123)
    expect(Date.now()).to.eql(123)
  })
})
