# LambCI command line helper

```console
npm install -g lambci-cli
```

You can then run `lambci` on the command line:

```console
$ lambci

Usage: lambci [--stack <stack>] <cmd> [options]

A command line tool for administering LambCI

Options:
--stack <stack>   LambCI stack name / prefix to use (default: lambci)
--help            Display help about a particular command

Commands:
info              General info about the LambCI stack
config            Display/edit config options
hook              Add/remove/update/show hook for GitHub repo
rebuild           Run a particular project build again

Report bugs at github.com/lambci/cli/issues
```

## lambci config

```console
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
```

## lambci hook

```console
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
```

## lambci rebuild

```console
Usage: lambci rebuild <project> <buildNum>

Run a particular project build again

Options:
--stack <stack>  LambCI stack name / prefix to use (default: lambci)
<project>        Project to rebuild (eg, gh/mhart/dynalite)
<buildNum>       The build you want to rebuild (eg, 23)
```
