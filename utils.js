var https = require('https')
var url = require('url')
var querystring = require('querystring')

// Just like normal Node.js https request, but supports `url`, `body` and `timeout` params
exports.request = function(options, cb) {
  cb = exports.once(cb)

  if (options.url) {
    var parsedUrl = url.parse(options.url)
    options.hostname = parsedUrl.hostname
    options.path = parsedUrl.path
    delete options.url
  }

  if (options.body) {
    options.method = options.method || 'POST'
    options.headers = options.headers || {}
    if (typeof options.body != 'string' && !Buffer.isBuffer(options.body)) {
      var contentType = options.headers['Content-Type'] || options.headers['content-type']
      options.body = contentType == 'application/x-www-form-urlencoded' ?
        querystring.stringify(options.body) : JSON.stringify(options.body)
    }
    var contentLength = options.headers['Content-Length'] || options.headers['content-length']
    if (!contentLength) options.headers['Content-Length'] = Buffer.byteLength(options.body)
  }

  var req = https.request(options, function(res) {
    var data = ''
    res.setEncoding('utf8')
    res.on('error', cb)
    res.on('data', function(chunk) { data += chunk })
    res.on('end', function() { cb(null, res, data) })
  }).on('error', cb)

  if (options.timeout != null) {
    req.setTimeout(options.timeout)
    req.on('timeout', function() { req.abort() })
  }

  req.end(options.body)
}

exports.once = function(cb) {
  var called = false
  return function() {
    if (called) return
    called = true
    cb.apply(this, arguments)
  }
}
