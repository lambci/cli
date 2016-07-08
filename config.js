exports.VERSION = require('./package.json').version
exports.REGION = require('awscred').loadRegionSync() || 'us-east-1'
exports.STACK = 'lambci'

// The JS AWS SDK doesn't currently choose the region from config files:
// https://github.com/aws/aws-sdk-js/issues/1039
require('aws-sdk').config.update({region: exports.REGION})
