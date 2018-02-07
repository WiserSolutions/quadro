const fs = require('fs')
const _ = require('lodash')

describe('Version retreiver', function() {
  let retreiver
  const versionFile = `${Q.app.appDir}/version.json`

  beforeEach(async function() {
    retreiver = await Q.container.getAsync('versionRetreiver')
    try {
      fs.unlinkSync(versionFile)
    } catch (err) {}
  })

  describe('getVersion', function() {
    describe('version.json exists', function() {
      it('returns parsed version.json', async function() {
        fs.writeFileSync(versionFile, '{"hello": "world"}')

        const version = await retreiver.getVersion()
        expect(version).to.eql({ hello: 'world' })
      })

      it('returns version.json as text', async function() {
        fs.writeFileSync(versionFile, 'hello world')

        const version = await retreiver.getVersion()
        expect(version).to.eql('hello world')
      })
    })

    describe('version.json does not exist', function() {
      it('returns version from git', async function() {
        const version = await retreiver.getVersion()

        expect(version).to.be.instanceOf(Array)
        expect(version).to.be.containSubset([
          {
            authorDate: _.isString,
            body: _.isString,
            authorDateRel: _.isString,
            hash: _.isString,
            abbrevHash: _.isString,
            authorName: _.isString,
            subject: _.isString
          }
        ])
      })
    })
  })
})
