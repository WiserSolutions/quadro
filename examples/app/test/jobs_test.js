describe.only('Jobs', function() {
  it('starts jobs on startup', function() {
    let jobsMap = Q.jobs.__registered
    let recurringJob = jobsMap['recurring']
    expect(recurringJob).to.not.eql(null)
    expect(recurringJob.getCounter()).to.be.gt(0)
    expect(recurringJob.getCounter() % 3).to.eql(0)
  })
  // describe('recurring tasks', function() {
  //   beforeEach(function() {
  //     QT.stubConfig('jobs.recurring.increment', 33)
  //   })
  //
  //   it('runs every 50ms', async function() {
  //     global.recurringCounter = 0
  //     await Promise.delay(60)
  //     expect(global.recurringCounter).to.equal(33)
  //   })
  //
  //   it('runs every configured interval', async function() {
  //     global.recurringCounter = 0
  //     QT.stubConfig('jobs.recurring.interval', 20)
  //     await Promise.delay(55)
  //     expect(global.recurringCounter).to.equal(66)
  //   })
  // })
})
