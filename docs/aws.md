# AWS

## Configuration

### Region

Order of precedence:

- env: `AWS_REGION`
- config: `quadro.aws.region`

### Credentials

Quadro intentionally works only with credentials profiles:

You can specify the profile to use trough:

- env: `AWS_PROFILE`
- config: `quadro.aws.profile`
- `default` profile is used

## Usage

Example:

```js
module.exports = async function(aws) {
  let cfn = new aws.CloudFormation()
  let stacks = await cfn.describeStacks().promise()
}
```

## Special case for DynamoDB

When in test mode Quadro defaults to Local DynamoDB. Specifically for this quadro
provides the `dynamodb` dependency - which is preconfigured to use the local dynamodb.

Local dynamodb is configured using the following:

`quadro.aws.dynamodb.local` - if true - local dynamodb will be used. This
setting is true by default in test mode.
`quadro.aws.dynamodb.port` - Integer - specifies the port to use for local dynamodb
