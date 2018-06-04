var client = require('mongodb').MongoClient
var helper = exports = module.exports = {}
var User = require('../../../model/User-model')
var config = require('../../../engine/Config')
// var buffer = require('fs').readFileSync(config.database.certLocation);
// var buffer = new Buffer('sdshdkjkdjhsjkhdjshdjkhdkjsdhkshd')
helper.locateSystemAdmin = function (callback) {
  User.findOne({username: 'system'}, function (err, admin) {
    if (!err && admin) {
      callback(null, admin)
    } else {
      callback('#system.init.invalid')
    }
  })
}
helper.createConn = function () {
  const args = Array.prototype.slice.call(arguments, 0)
  var callback = args.pop()
  var url = config.database.connectionString
  try {
    client.connect(url, function (err, db) {
      if (!err && db) {
        db.stats(function (err, stats) {
          if (!err) {
            callback(null, url)
            db.close()
          } else {
            callback(err)
            db.close()
          }
        })
      } else {
        callback(err)
      }
    })
  } catch (e) {
    callback(e)
  }
}
module.exports = helper
