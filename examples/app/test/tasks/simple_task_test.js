/* eslint no-unused-expressions: 0 */

// TODO: ! has to be finished to ensure what was expected initialized and what not!
describe('Tasks', function() {
  it('runs simple tasks', async function() {
    this.sinon.stub(process, 'exit').callsFake(_ => null)
    let taskRunner = await Q.container.getAsync('taskRunner')
    await taskRunner.run('fooTask')
    expect(global.simpleTaskExecuted).to.be.true
    expect(process.exit).to.have.been.calledWith(0)
  })
})
