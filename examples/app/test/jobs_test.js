describe('Jobs', function() {
  it('starts jobs on startup', function() {
    let jobsMap = Q.jobs.__registered
    let recurringJob = jobsMap['recurring']
    expect(recurringJob).to.not.eql(null)
    expect(recurringJob.getCounter()).to.be.gt(0)
    expect(recurringJob.getCounter() % 3).to.eql(0)
  })

  describe('register', function() {
    beforeEach(function() {
      this.clock = this.sinon.useFakeTimers(0)
    })
    afterEach(function() { this.clock.restore() })

    it('something', async function() {
      let counter = 0
      function run() {
        Promise.delay(100).then(() => counter++).then(() => run())
      }
      run()
      this.clock.tick(8000)
      Q.log.info(counter)
      expect(counter).to.eql(80)
    })

    it('runs every @interval', async function() {
      let spy = this.sinon.spy()
      let j = class { run() { spy() } }
      j['@interval'] = 60
      await Q.jobs.register(j, 'task1')
      this.clock.tick(180000)
      expect(spy).to.have.been.callCount(3)
    })

    it('runs every configured interval', async function() {
      let spy = this.sinon.spy()
      QT.stubConfig(`quadro.jobs.task2.interval`, 35)
      await Q.jobs.register(class { run() { spy() } }, 'task2')
      this.clock.tick(180000)
      expect(spy).to.have.been.callCount(5)
    })
  })
})
