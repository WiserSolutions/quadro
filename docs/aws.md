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
