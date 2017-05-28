describe('app', function() {
  describe('Q.container', function() {
    it('has container registered', function() {
      let c = Q.container.get('container')
      expect(c).to.not.eql(null)
    })

    it('registers self as container', function() {
      expect(Q.container.get('container')).to.equal(Q.container)
    })
  })

  describe('on load', function() {
    it('execute', function() {
      expect(Q.app.appLoadEventInitializerSuccess).to.eql(true)
    })
  })

  describe('glob', function() {
    it('returns files', async function() {
      expect(await Q.app.glob('*.js'))
        .to.eql([
          `${Q.app.appDir}/app.js`
        ])
    })

    it('returns files from quadro package if `opts.dir` has `quadro`', async function() {
      expect(await Q.app.glob('*.json', { dirs: ['quadro', 'app'] }))
        .to.eql([
          `${Q.app.quadroDir}/package.json`,
          `${Q.app.appDir}/package.json`
        ])
    })

    it('supports quadroLib', async function() {
      expect(await Q.app.glob('di/*.js', { dirs: ['quadroLib'] }))
        .to.eql([
          `${Q.app.quadroDir}/lib/di/container.js`,
          `${Q.app.quadroDir}/lib/di/metadata.js`
        ])
    })
  })

  describe('glob with `verbose`', function() {
    it('returns detailed information about the files', async function() {
      expect(await Q.app.glob('*.json', { dirs: ['quadro', 'app'], verbose: true }))
        .to.eql([
          {
            relativePath: 'package.json',
            absolutePath: `${Q.app.quadroDir}/package.json`,
            basePath: Q.app.quadroDir
          },
          {
            relativePath: 'package.json',
            absolutePath: `${Q.app.appDir}/package.json`,
            basePath: Q.app.appDir
          }
        ])
    })
  })
})
