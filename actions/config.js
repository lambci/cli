var db = require('../db')

module.exports = config

function config(opts) {
  var configName = opts.unset || opts._[1]
  if (!configName || opts.help || opts.h) {
    var isErr = !(opts.help || opts.h)
    console[isErr ? 'error' : 'log'](
`
Usage: lambci config [--project <project>] [--unset] <name> [<value>]

Display/edit the specified config value (using dot notation)

Options:
--stack <stack>      LambCI stack name / prefix to use (default: lambci)
--project <project>  Project config to edit, eg 'gh/mhart/dynalite' (default: global)
--unset              Unset (delete) this config value
<name>               Name of the config property (using dot notation)
<value>              Value to set config (if not supplied, just display it)


Examples:

To set the global GitHub token to 'abcdef01234':

    lambci config secretEnv.GITHUB_TOKEN abcdef01234

To override the GitHub token for a particular project:

    lambci config --project gh/mhart/dynalite secretEnv.GITHUB_TOKEN abcdef01234

To retrieve the global Slack channel:

    lambci config notifications.slack.channel


Report bugs at github.com/lambci/cli/issues
`
    )
    return process.exit(isErr ? 1 : 0)
  }

  if (opts.unset) {
    db.deleteConfig(opts.unset, opts.project, function(err) {
      if (err) return console.error(err)
    })
  } else if (opts._[2]) {
    db.editConfig(opts._[1], opts._[2], opts.project, function(err) {
      if (err) return console.error(err)
    })
  } else {
    db.getConfig(opts._[1], opts.project, function(err, value) {
      if (err) {
        console.error(err)
        return process.exit(1)
      }
      console.log(value == null ? '' : value)
    })
  }
}


