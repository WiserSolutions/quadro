const stdSerializers = require('bunyan').stdSerializers
const _ = require('lodash')

module.exports = _.merge({}, stdSerializers, {
  err: ErrorSerializer
})

function ErrorSerializer(err) {
  let additionalAttrs = { extra: err.extra }
  if (err.nestedError) {
    additionalAttrs.nestedError = ErrorSerializer(err.nestedError)
  }
  return _.merge(stdSerializers.err(err), additionalAttrs)
}
