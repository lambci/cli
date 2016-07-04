var AWS = require('aws-sdk')
var config = require('../config')

var lambda = new AWS.Lambda()

module.exports = rebuild

function rebuild(opts) {
  var project = opts._[1]
  var buildNum = +opts._[2]
  if (!project || !buildNum || opts.help || opts.h) {
    return console.log(
`
Usage: lambci rebuild <project> <buildNum>

Run a particular project build again

Options:
--stack <stack>  LambCI stack name / prefix to use (default: lambci)
<project>        Project to rebuild (eg, gh/mhart/dynalite)
<buildNum>       The build you want to rebuild (eg, 23)

Report bugs at github.com/lambci/cli/issues
`
    )
  }

  lambda.invoke({
    FunctionName: `${config.STACK}-build`,
    LogType: 'Tail',
    Payload: JSON.stringify({
      action: 'rebuild',
      project,
      buildNum,
    }),
  }, function(err, data) {
    if (err && err.code == 'ResourceNotFoundException') {
      err = new Error(`LambCI stack '${config.STACK}' does not exist or has no Lambda function`)
    }
    if (err) {
      console.error(err)
      return process.exit(1)
    }
    if (data.LogResult) {
      console.log(formatLogResult(data.LogResult))
    }
    var response = JSON.parse(data.Payload)
    if (data.FunctionError && response && response.errorMessage) {
      console.error(response.errorMessage)
      if (!/^gh\//.test(project)) {
        console.error('Try specifying the git source at the start of your project, eg:')
        console.error(`gh/${project}`)
      }
      return process.exit(1)
    }
  })
}

function formatLogResult(logResult) {
  return new Buffer(logResult, 'base64').toString('utf8')
    .split('\n')
    .map(line => line.replace(/^.+\t.+\t/, ''))
    .join('\n')
}
