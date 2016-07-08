var config = require('./config')
var utils = require('./utils')

var USER_AGENT = 'lambci-cli'

exports.createClient = function(token, repo) {
  return new GithubClient(token, repo)
}

exports.GithubClient = GithubClient

function GithubClient(token, repo) {
  this.token = token
  this.repo = repo
}

// By default this will just ensure that the SNS hook listens for push & pull_request
GithubClient.prototype.updateSnsHook = function(options, cb) {
  options = options || {events: ['push', 'pull_request']}
  var getHookId = cb => options.id ? cb(null, options.id) : this.getSnsHook((err, hook) => cb(err, hook && hook.id))
  getHookId((err, id) => {
    if (err) return cb(err)
    this.updateHook(id, options, cb)
  })
}

GithubClient.prototype.deleteSnsHook = function(id, cb) {
  var getHookId = cb => id ? cb(null, id) : this.getSnsHook((err, hook) => cb(err, hook && hook.id))

  console.log(`Deleting SNS hook for ${this.repo}`)

  getHookId((err, id) => {
    if (err) return cb(err)
    if (!id) return cb()
    this.deleteHook(id, cb)
  })
}

GithubClient.prototype.getSnsHook = function(cb) {
  this.listHooks((err, data) => cb(err, data && data.find(hook => hook.name == 'amazonsns')))
}

GithubClient.prototype.createOrUpdateSnsHook = function(awsKey, awsSecret, snsTopic, cb) {
  var hook = {
    name: 'amazonsns',
    active: true,
    events: ['push', 'pull_request'],
    // https://github.com/github/github-services/blob/master/lib/services/amazon_sns.rb
    config: {
      aws_key: awsKey,
      aws_secret: awsSecret,
      sns_topic: snsTopic,
      sns_region: config.REGION,
    },
  }

  console.log(`Updating SNS hook for ${this.repo}`)

  this.createHook(hook, cb)
}

GithubClient.prototype.listHooks = function(cb) {
  this.request({path: `/repos/${this.repo}/hooks`}, cb)
}

// See: https://developer.github.com/v3/repos/hooks/#create-a-hook
// hook can be: {name: '', config: {}, events: [], active: true}
GithubClient.prototype.createHook = function(hook, cb) {
  this.request({path: `/repos/${this.repo}/hooks`, body: hook}, cb)
}

// See: https://developer.github.com/v3/repos/hooks/#edit-a-hook
// updates can be: {config: {}, events: [], add_events: [], remove_events: [], active: true}
GithubClient.prototype.updateHook = function(id, updates, cb) {
  this.request({method: 'PATCH', path: `/repos/${this.repo}/hooks/${id}`, body: updates}, cb)
}

// See: https://developer.github.com/v3/repos/hooks/#delete-a-hook
GithubClient.prototype.deleteHook = function(id, cb) {
  this.request({method: 'DELETE', path: `/repos/${this.repo}/hooks/${id}`}, cb)
}

GithubClient.prototype.request = function(options, cb) {
  /* eslint dot-notation:0 */
  options.host = 'api.github.com'
  options.headers = options.headers || {}
  options.headers['Accept'] = 'application/vnd.github.v3+json'
  options.headers['User-Agent'] = USER_AGENT
  if (options.body) {
    options.headers['Content-Type'] = 'application/vnd.github.v3+json'
  }
  if (this.token) {
    options.headers['Authorization'] = `token ${this.token}`
  }
  utils.request(options, function(err, res, data) {
    if (err) return cb(err)
    if (!data && res.statusCode < 400) return cb(null, {})

    var json
    try {
      json = JSON.parse(data)
    } catch (e) {
      err = new Error(data ? `Could not parse response: ${data}` : res.statusCode)
      err.statusCode = res.statusCode
      err.body = data
      return cb(err)
    }
    if (res.statusCode >= 400) {
      var errMsg = json.message || data
      if (res.statusCode == 401) {
        errMsg = 'GitHub token is invalid'
      } else if (res.statusCode == 404) {
        errMsg = 'GitHub token has insufficient privileges or repository does not exist'
      }
      err = new Error(errMsg)
      err.statusCode = res.statusCode
      err.body = json
      return cb(err)
    }
    cb(null, json)
  })
}

