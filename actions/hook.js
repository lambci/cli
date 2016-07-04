var fs = require('fs')
var path = require('path')
var AWS = require('aws-sdk')
var config = require('../config')
var github = require('../github')

module.exports = hook

function hook(opts) {
  var token = opts.token || opts['hub-token']
  var repo = opts.add || opts.remove || opts.update || opts.show
  if (!token || typeof repo != 'string' || opts.help || opts.h) {
    var isErr = !(opts.help || opts.h)
    console[isErr ? 'error' : 'log'](
`
Usage: lambci hook [--token <token>|--hub-token] <cmd> <repo> [options]

Add/remove/update/show hook for GitHub repo

Options:
--stack <stack>       LambCI stack name / prefix to use (default: lambci)
--token <token>       GitHub API token to use
--hub-token           Use the API token from ~/.config/hub (if you have installed 'hub')
<cmd>                 --add / --remove / --update / --show
<repo>                GitHub repo to add/update/remove hook from (eg, mhart/dynalite)
--topic <topic>       SNS topic to use with --add (defaults to value from CloudFormation stack)
--key <accessKeyId>   AWS access key to use with --add (defaults to value from CloudFormation stack)
--secret <secretKey>  AWS secret key to use with --add (defaults to value from CloudFormation stack)


Examples:

To add a hook to the mhart/dynalite repo if you have a LambCI CloudFormation stack:

    lambci hook --token abcdef0123 --add mhart/dynalite

To add a hook using the GitHub token if you've installed 'hub':

    lambci hook --hub-token --add mhart/dynalite

To add a hook using specific params instead of from a CloudFormation stack:

    lambci hook --token abcd --add mhart/dynalite --topic arn:aws:sns:... --key ABCD --secret 234832

To update an existing hook just to ensure it responds to the correct events:

    lambci hook --token abcd --update mhart/dynalite

To show the existing hooks in a repo:

    lambci hook --token abcd --show mhart/dynalite

To remove a LambCI (SNS) hook from a repo:

    lambci hook --token abcd --remove mhart/dynalite


Report bugs at github.com/lambci/cli/issues
`
    )
    return process.exit(isErr ? 1 : 0)
  }

  if (opts['hub-token']) {
    var homeDir = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME']
    var hubFile = fs.readFileSync(path.join(homeDir, '.config', 'hub'), 'utf8')
    var match = hubFile.match(/oauth_token:\s*([a-f0-9]+)/)
    if (!match) {
      console.error('Could not find oauth_token key in ~/.config/hub')
      return process.exit(1)
    }
    token = match[1].trim()
  }
  var client = github.createClient(token, repo)

  if (opts.show) {
    return client.listHooks(function(err, data) {
      if (err) {
        console.error(err)
        return process.exit(1)
      }
      console.log(data)
    })
  } else if (opts.remove) {
    return client.deleteSnsHook(null, function(err) {
      if (err) {
        console.error(err)
        return process.exit(1)
      }
    })
  } else if (opts.update) {
    return client.updateSnsHook(null, function(err) {
      if (err) {
        console.error(err)
        return process.exit(1)
      }
    })
  }

  var topic = opts.topic
  var key = opts.key
  var secret = opts.secret

  if (topic && key && secret) {
    return client.createOrUpdateSnsHook(key, secret, topic, function(err) {
      if (err) {
        console.error(err)
        return process.exit(1)
      }
    })
  }

  var cfn = new AWS.CloudFormation()
  cfn.describeStacks({StackName: config.STACK}, function(err, data) {
    if (err) {
      console.error(err)
      return process.exit(1)
    }
    var outputs = data.Stacks[0].Outputs
    topic = (outputs.find(output => output.OutputKey == 'SnsTopic') || {}).OutputValue
    key = (outputs.find(output => output.OutputKey == 'SnsAccessKey') || {}).OutputValue
    secret = (outputs.find(output => output.OutputKey == 'SnsSecret') || {}).OutputValue
    if (!topic || !key || !secret) {
      console.error('Could not find topic key and secret in stack outputs, please specify on command line')
      return process.exit(1)
    }
    client.createOrUpdateSnsHook(key, secret, topic, function(err) {
      if (err) {
        console.error(err)
        return process.exit(1)
      }
    })
  })
}
