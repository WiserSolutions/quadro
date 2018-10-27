/* eslint no-unused-expressions: 0 */
describe('Jobs', function() {
  it('starts jobs on startup', function() {
    let jobsMap = Q.jobs.__registered
    let recurringJob = jobsMap['recurring']
    expect(recurringJob).to.not.eql(null)
    expect(recurringJob.getCounter()).to.be.gt(0)
    expect(recurringJob.getCounter() % 3).to.eql(0)
  })

  describe('auto run', function() {
    beforeEach(function() {
      this.sinon.stub(Q.jobs, 'scheduleJob').returns(Promise.resolve(true))
    })

    context('app.isREPL === true', function() {
      beforeEach(function() {
        this.sinon.stub(Q.app, 'isTestEnv').value(false)
        this.sinon.stub(Q.app, 'isREPL').get(() => true)
      })
      it('does not run jobs', async function() {
        await Q.jobs.register(class { run() {} }, 'replTestJob')
        expect(Q.jobs.scheduleJob).to.not.have.been.called
      })
    })

    context('test mode', function() {
      beforeEach(function() { this.sinon.stub(Q.app, 'isTestEnv').get(() => true) })

      it('does not run jobs', async function() {
        await Q.jobs.register(class { run() {} }, 'task1')
        expect(Q.jobs.scheduleJob).to.not.have.been.called
      })

      context('quadro.jobs.<name>.enabled: true', function() {
        it('does run the job', async function() {
          QT.stubConfig('quadro.jobs.task3.enabled', true)
          await Q.jobs.register(class { run() {} }, 'task3')
          expect(Q.jobs.scheduleJob).to.have.been.called
        })
      })

      context('quadro.jobs.@enable_all: true', function() {
        it('does run the job', async function() {
          QT.stubConfig('quadro.jobs.all.enabled', true)
          await Q.jobs.register(class { run() {} }, 'task4')
          expect(Q.jobs.scheduleJob).to.have.been.called
        })
      })
    })
  })

  describe('register', function() {
    beforeEach(function() {
      this.clock = this.sinon.useFakeTimers(0)
    })
    afterEach(function() { this.clock.restore() })

    it('runs every @interval', async function() {
      QT.stubConfig(`quadro.jobs.task1.enabled`, true)
      let spy = this.sinon.spy()
      let j = class { run() { spy() } }
      j['@interval'] = 60
      await Q.jobs.register(j, 'task1')
      this.clock.tick(180000)
      expect(spy).to.have.been.callCount(3)
    })

    it('runs every configured interval', async function() {
      let spy = this.sinon.spy()
      QT.stubConfig(`quadro.jobs.task2.enabled`, true)
      QT.stubConfig(`quadro.jobs.task2.interval`, 35)
      await Q.jobs.register(class { run() { spy() } }, 'task2')
      this.clock.tick(180000)
      expect(spy).to.have.been.callCount(5)
    })
  })
})
