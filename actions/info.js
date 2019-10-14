var AWS = require('aws-sdk')
var config = require('../config')

var lambda = new AWS.Lambda()

module.exports = info

function info() {
  console.log(`CLI version: ${config.VERSION}`)
  console.log(`Stack name: ${config.STACK}`)
  console.log(`Region: ${config.REGION}`)

  lambda.invoke({
    FunctionName: `${config.STACK}-build`,
    Payload: JSON.stringify({
      action: 'version',
    }),
  }, function(err, data) {
    if (err && err.code == 'ResourceNotFoundException') {
      err = new Error(`LambCI stack '${config.STACK}' does not exist or has no Lambda function named '${config.STACK}-build'`)
    }
    if (err) {
      console.error(err)
      return process.exit(1)
    }
    var response = JSON.parse(data.Payload)
    if (data.FunctionError && response && response.errorMessage) {
      console.error(response.errorMessage)
      return process.exit(1)
    }
    console.log(`LambCI version: ${response}`)
  })
}

