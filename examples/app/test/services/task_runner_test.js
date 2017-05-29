describe('TaskRunner', function() {
  let runner, processExit
  beforeEach(async function() {
    processExit = this.sinon.stub(process, 'exit').callsFake()
    runner = await Q.container.getAsync('taskRunner')
  })

  it('exits the process', async function() {
    await runner.run('demo')
    expect(processExit).to.have.been.calledWith(0)
  })

  it('exists with 127 if command not found', async function() {
    await runner.run('nonExisting')
    expect(processExit).to.have.been.calledWith(127)
  })

  it('runs a function task', async function() {
    global.demoTaskRunResult = null
    await runner.run('demo')
    expect(global.demoTaskRunResult).to.equal('taskRun')
  })

  it('runs a class task', async function() {
    global.demoTaskRunResult = null
    await runner.run('classTask')
    expect(global.demoTaskRunResult).to.equal('classTaskRun')
  })
})
