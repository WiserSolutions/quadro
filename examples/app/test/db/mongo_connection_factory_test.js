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
  })

  describe('_parseConnectionString', function() {
    it('supports multiple hosts, no db, no options', function() {
      expect(mcf._parseConnectionString('mongodb://host1.com,host2.com'))
        .to.eql({
          connectionString: 'mongodb://host1.com,host2.com'
        })
    })

    it('supports multiple hosts + db, no options', function() {
      expect(mcf._parseConnectionString('mongodb://host1.com,host2.com/hello'))
        .to.eql({
          connectionString: 'mongodb://host1.com,host2.com',
          dbName: 'hello'
        })
    })

    it('supports multiple hosts + options, no db', function() {
      expect(mcf._parseConnectionString('mongodb://host1.com,host2.com/?replicaSet=123'))
        .to.eql({
          connectionString: 'mongodb://host1.com,host2.com?replicaSet=123'
        })
    })

    it('supports multiple hosts + db + options', function() {
      expect(mcf._parseConnectionString('mongodb://host1.com,host2.com/hello?replicaSet=123'))
        .to.eql({
          connectionString: 'mongodb://host1.com,host2.com?replicaSet=123',
          dbName: 'hello'
        })
    })
  })
})
