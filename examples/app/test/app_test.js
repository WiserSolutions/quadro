describe('app', function() {
  describe('glob', function() {
    it('returns files', async function() {
      expect(await app.glob('*.js'))
        .to.eql([
          `${app.appDir}/app.js`
        ])
    })

    it('returns files from quadro package if `opts.dir` has `quadro`', async function() {
      expect(await app.glob('*.json', { dirs: ['quadro', 'app'] }))
        .to.eql([
          `${app.quadroDir}/package.json`,
          `${app.appDir}/package.json`
        ])
    })

    it('supports quadroLib', async function() {
      expect(await app.glob('di/*.js', { dirs: ['quadroLib'] }))
        .to.eql([
          `${app.quadroDir}/lib/di/container.js`
        ])
    })
  })
})
