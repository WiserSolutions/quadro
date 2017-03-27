describe('AWS SDK', function() {
  if (process.env.CIRCLECI) return

  beforeEach(function() {
    QT.stubConfig('quadro.aws.region', 'us-west-2')
  })

  async function getStacks(aws) {
    let cfn = new aws.CloudFormation()
    return await cfn.describeStacks().promise()
  }

  describe('profile credentials', function() {
    it('uses configured profile', async function() {
      QT.stubConfig('quadro.aws.profile', 'quadro-test')
      let aws = await Q.container.getAsync('aws-factory')
      await expect(getStacks(aws)).to.be.rejectedWith('Missing credentials')
    })

    it('uses configured region', async function() {
      QT.stubConfig('quadro.aws.region', 'us-north-middle-128')
      let aws = await Q.container.getAsync('aws-factory')
      await expect(getStacks(aws)).to.be.rejectedWith('Inaccessible host')
    })

    it('configures SDK', async function() {
      this.timeout(5000)

      let aws = await Q.container.getAsync('aws-factory')
      expect(await getStacks(aws)).to.not.eql(null)
    })
  })
})
