describe('stats', function() {
  describe('default tags', function() {
    let Stats

    beforeEach(function() {
      Stats = Q.container.getDefinition('stats')
    })

    it('adds env_id if env.id is set', async function() {
      QT.stubConfig('env.id', 'hello')
      const stats = await Q.container.create(Stats)
      expect(stats.options.tags).to.containSubset({ env_id: 'hello' })
    })

    it('adds env', async function() {
      const stats = await Q.container.create(Stats)
      expect(stats.options.tags).to.containSubset({ env: 'test' })
    })

    it('uses env=env.STAGE if set', async function() {
      process.env.STAGE = 'theStage'
      const stats = await Q.container.create(Stats)
      expect(stats.options.tags).to.containSubset({ env: 'theStage' })
    })

    it('adds service=app.name', async function() {
      const stats = await Q.container.create(Stats)
      expect(stats.options.tags).to.containSubset({ service: 'quadro_demo_app' })
    })
  })

  it('is a valid object', async function() {
    const statsd = await Q.container.getAsync('stats')
    expect(typeof statsd.increment).to.eql('function')
    expect(typeof statsd.gauge).to.eql('function')
    expect(typeof statsd.timing).to.eql('function')
  })
})
