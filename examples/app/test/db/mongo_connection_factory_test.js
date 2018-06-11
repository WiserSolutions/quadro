/* eslint no-unused-expressions: 0 */

describe('MongoConnectionFactory', function() {
  let mcf

  beforeEach(async() => mcf = await Q.container.getAsync('mongoConnectionFactory'))

  describe('createClient', function() {
    it('does not support database spec', async function() {
      await expect(mcf.createClient('mongodb://host/db'))
        .to.be.rejectedWith(Q.Errors.MongoConnectionError)
    })
  })

  describe('connectToDB', function() {
    it('requires a database spec', async function() {
      for (var s of ['mongodb://host', 'mongodb://host/']) {
        await expect(mcf.connectToDB(s))
          .to.be.rejectedWith(Q.Errors.MongoConnectionError)
      }
    })

    it('returns a db', async function() {
      const db = mcf.connectToDB('mongodb://host/hello')
      expect(db).to.be.ok
    })
  })
})
