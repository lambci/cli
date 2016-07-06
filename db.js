var AWS = require('aws-sdk')
var config = require('./config')

var client = new AWS.DynamoDB.DocumentClient()

exports.getConfig = function(name, project, cb) {
  var table = configTable()
  project = project || 'global'

  var parsed = parsePathStr(name)

  client.get({
    TableName: table,
    Key: {project},
    ProjectionExpression: parsed.projExpr,
    ExpressionAttributeNames: parsed.attrNames,
  }, function(err, data) {
    if (err) return cb(friendlyErr(table, err))
    cb(null, walk(data.Item, parsed.path))
  })
}

exports.editConfig = function(name, value, project, cb) {
  var table = configTable()
  project = project || 'global'

  var parsed = parsePathStr(name)

  // Convert boolean looking strings
  if (~['true', 'false'].indexOf(value)) {
    value = (value === 'true')
  }

  client.update({
    TableName: table,
    Key: {project},
    UpdateExpression: `SET ${parsed.projExpr} = :val`,
    ExpressionAttributeNames: parsed.attrNames,
    ExpressionAttributeValues: {':val': value},
  }, function(err) {
    if (err && err.code == 'ValidationException' && /invalid for update/.test(err.message)) {
      var rootProp = parsed.path[0]
      return exports.getConfig(rootProp, project, function(err, rootVal) {
        if (err) return cb(friendlyErr(table, err))
        rootVal = rootVal || {}
        createProperty(rootVal, parsed.path.slice(1), value)
        exports.editConfig(rootProp, rootVal, project, cb)
      })
    }
    if (err) return cb(friendlyErr(table, err))
    cb()
  })
}

exports.deleteConfig = function(name, project, cb) {
  var table = configTable()
  project = project || 'global'

  var parsed = parsePathStr(name)

  client.update({
    TableName: table,
    Key: {project},
    UpdateExpression: `REMOVE ${parsed.projExpr}`,
    ExpressionAttributeNames: parsed.attrNames,
  }, function(err, data) {
    if (err) return cb(friendlyErr(table, err))
    cb(null, data)
  })
}

function parsePathStr(str) {
  var path = str.split('.')
  var projExprs = []
  var attrNames = path.reduce((obj, name) => {
    projExprs.push(`#${name}`)
    obj[`#${name}`] = name
    return obj
  }, {})
  return {
    path,
    attrNames,
    projExpr: projExprs.join('.'),
  }
}

function walk(obj, path) {
  if (!path.length || obj == null) return obj
  var prop = path.shift()
  return walk(obj[prop], path)
}

function createProperty(obj, path, value) {
  var prop = path.shift()
  if (!path.length) {
    obj[prop] = value
    return
  }
  obj[prop] = {}
  createProperty(obj[prop], path, value)
}

function configTable() {
  return `${config.STACK}-config`
}

function friendlyErr(table, err) {
  switch (err.code) {
    case 'UnrecognizedClientException':
      return new Error('Incorrect AWS_ACCESS_KEY_ID or AWS_SESSION_TOKEN')
    case 'InvalidSignatureException':
      return new Error('Incorrect AWS_SECRET_ACCESS_KEY')
    case 'AccessDeniedException':
      return new Error(`Insufficient credentials to access DynamoDB table ${table}`)
    case 'ResourceNotFoundException':
      return new Error(`LambCI stack '${config.STACK}' does not exist or has no DynamoDB tables`)
  }
  return err
}

