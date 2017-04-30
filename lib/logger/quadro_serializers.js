const stdSerializers = require('bunyan').stdSerializers
const _ = require('lodash')

module.exports = _.merge({}, stdSerializers, {
  err: ErrorSerializer
})

function ErrorSerializer(err) {
  return _.merge(stdSerializers.err(err), { extra: err.extra })
}
