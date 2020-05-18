describe('AWS SDK', function() {
  beforeEach(function() {
    QT.stubConfig('quadro.aws.region', 'us-west-2')
  })

  async function getStacks(aws) {
    let cfn = new aws.CloudFormation()
    return cfn.listStacks().promise()
  }

  describe('profile credentials', function() {
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
