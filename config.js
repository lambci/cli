exports.VERSION = require('./package.json').version
exports.REGION = require('awscred').loadRegionSync() || 'us-east-1'
exports.STACK = 'lambci'

// The JS AWS SDK doesn't currently choose the region correctly
require('aws-sdk').config.update({region: exports.REGION})
