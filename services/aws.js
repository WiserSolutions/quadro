const AWS = require('aws-sdk')
const container = Q.container

function createSDK(config) {
  // https://aws.amazon.com/blogs/developer/support-for-promises-in-the-sdk/
  AWS.config.setPromisesDependency(Promise)

  // http://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-region.html
  let region = process.env.AWS_REGION || config.get('quadro.aws.region')
  AWS.config.update({ region })
  return AWS
}

// Expose an SDK factory for testing
if (Q.app.env === 'test') {
  container.register('aws-factory', createSDK)
}

module.exports = createSDK
