
var AuthDetail = require('../../../model/AuthDetail-model')
var Session = require('../../../model/Session-model')

function AUTHHelper () {

}
AUTHHelper.prototype.createSession = function (channel, org, deviceId, application, callback) {
  var session = new Session()
  session.channel = channel
  session.organizationID = org.organisationName
  session.deviceId = deviceId
  session.application = application
  session.save(function (err, data) {
    if (!err && data) {
      callback(null, data.token)
    } else {
      console.error(err)
      callback('#session.create.error')
    }
  })
}
AUTHHelper.prototype.locateDeviceId = function (did, callback) {
  AuthDetail.findOne({'device.deviceId': did}, function (err, user) {
    if (!err && user) {
      return callback(err, user)
    } else {
      return callback('#did.ntf')
    }
  })
}
module.exports = new AUTHHelper()
