const AWS = require('aws-sdk')

module.exports = function(container, config) {
  container.register('aws', function() {
    // http://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/loading-node-credentials-shared.html
    let profile = process.env.AWS_PROFILE || config.get('quadro.aws.profile') || 'default'
    AWS.config.credentials = new AWS.SharedIniFileCredentials({ profile })

    // https://aws.amazon.com/blogs/developer/support-for-promises-in-the-sdk/
    AWS.config.setPromisesDependency(Promise)

    // http://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-region.html
    let region = process.env.AWS_REGION || config.get('quadro.aws.region')
    AWS.config.update({ region })
    return AWS
  })
}
