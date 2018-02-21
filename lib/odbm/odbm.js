Q.Errors.declare('RecordNotFound', 'No record matched key/query')
Q.Errors.declare('OnlyOneRecordExpected', 'One record expected, but multiple returned')
Q.Errors.declare('AtMostOneRecordExpected', 'Expected to find one record or no records at all')

module.exports = async function odbm(container, log) {
  const Model = require('./model')
  Q.Repository = require('./repository')
  const MongoAdapter = require('./adapters/mongo')
  const ActiveRecord = require('./active_record')

  Q.Model = function(name, spec, options) {
    log.trace({ modelName: name }, 'Registering model')
    let Klass = Model.createModelClass(name, spec)

    Klass.repository = createRepository(Klass)
    ActiveRecord.apply(Klass)

    return Klass
  }

  async function createRepository(Model) {
    let mongoAdapter = await container.getAsync('mongo')
    return new Q.Repository(Model, new MongoAdapter(mongoAdapter, Model))
  }

  Q.Model.Class = Model
}
