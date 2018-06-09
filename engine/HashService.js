var bcrypt = require('bcryptjs')
var jwt = require('jsonwebtoken')
var SALT_WORK_FACTOR = 10
var TOKEN_PASS = 'SILINDATN_FC'

function HashService () {
    /*
        LOAD THESE FROM THE SYSTEM
        PROCESS
     */
  SALT_WORK_FACTOR = process.env.SALT_WORK_FACTOR || SALT_WORK_FACTOR
  TOKEN_PASS = process.env.TOKEN_PASS || TOKEN_PASS
}
HashService.prototype.encrypt = function (password, callback) {
  bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
    if (err) return callback(err)
    bcrypt.hash(password, salt, function (err, hashedPassword) {
      callback(err, hashedPassword)
    })
  })
}
HashService.prototype.compare = function (raw, hash, callback) {
  bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
    if (err) return callback(err)
    bcrypt.compare(raw, hash, function (err, isMatch) {
      callback(err, isMatch)
    })
  })
}
HashService.prototype.createToken = function (user, callback) {
  callback(null, jwt.sign(user, TOKEN_PASS))
}
HashService.prototype.verify = function (token, callback) {
  jwt.verify(token, TOKEN_PASS, function (err, user) {
    callback(err, user)
  })
}

module.exports = new HashService()
