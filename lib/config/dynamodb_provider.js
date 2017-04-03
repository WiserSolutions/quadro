module.exports = class DynamoDBConfigProvider {
  constructor(dynamodb, tableName) {
    this.dynamodb = dynamodb
    this.tableName = tableName
  }

  async initialize() {
    await ensureConfigTableExists(this.dynamodb, this.tableName)
  }

  async get(key) {
    let record = await this.dynamodb.getItem({
      TableName: this.tableName,
      Key: { 'key': { 'S': key } }
    }).promise()
    return record.Item.value.S
  }

  async set(key, value) {
    value = value.toString()
    await this.dynamodb.updateItem({
      TableName: this.tableName,
      Key: { 'key': { 'S': key } },
      ExpressionAttributeNames: { '#V': 'value' },
      ExpressionAttributeValues: { ':v': { 'S': value } },
      UpdateExpression: 'SET #V = :v'
    }).promise()
  }
}

async function ensureConfigTableExists(dynamodb, tableName) {
  let tables = await dynamodb.listTables().promise()
  if (tables.TableNames.includes(tableName)) return

  Q.log.debug({ tableName }, 'Config table does not exist. Creating one')

  await dynamodb.createTable({
    TableName: tableName,
    AttributeDefinitions: [{ AttributeName: 'key', AttributeType: 'S' }],
    KeySchema: [{ AttributeName: 'key', KeyType: 'HASH' }],
    ProvisionedThroughput: {
      ReadCapacityUnits: 25,
      WriteCapacityUnits: 25
    }
  }).promise()
}
