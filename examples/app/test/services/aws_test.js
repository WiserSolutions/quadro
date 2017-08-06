describe('AWS SDK', function() {
  describe('DynamoDB', function() {
    it('uses local dynamodb', async function() {
      let dynamodb = await Q.container.getAsync('dynamodb')
      expect(dynamodb.endpoint.hostname).to.eql('localhost')
      expect(dynamodb.endpoint.port).to.eql(4567)
    })

    it('can perform dynamodb operations', async function() {
      this.timeout(5000)

      const TABLE_NAME = 'test-tbl'
      let dynamodb = await Q.container.getAsync('dynamodb')
      let tables = await dynamodb.listTables({}).promise()
      if (tables.TableNames.includes(TABLE_NAME)) {
        await dynamodb.deleteTable({ TableName: TABLE_NAME }).promise()
      }
      await dynamodb.createTable({
        TableName: TABLE_NAME,
        AttributeDefinitions: [{ AttributeName: 'key', AttributeType: 'S' }],
        KeySchema: [{ AttributeName: 'key', KeyType: 'HASH' }],
        ProvisionedThroughput: {
          ReadCapacityUnits: 10,
          WriteCapacityUnits: 10
        }
      }).promise()
    })
  })

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
