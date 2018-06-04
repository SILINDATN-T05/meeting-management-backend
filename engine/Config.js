var config = exports = module.exports = {}
var fs = require('fs')
var config_helper = require('../application/setup/helper/config_helper')
var data = JSON.parse(fs.readFileSync(config_helper.configPath(), 'utf8'))
var util = require('util')

var loadConfig = function () {
  if (data === undefined) {
    throw Error('Config file does not exist')
  }
  return (data.local)
}
module.exports = loadConfig()
