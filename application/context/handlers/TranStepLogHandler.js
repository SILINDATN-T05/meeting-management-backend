
var Model            =      require('../../../model/index');
var log4js           =      require('log4js');
var logger           =      log4js.getLogger('KYC_LOGGER');
var TranStepLog      =      Model.TranStepLog;

var handler = function () {};

handler.prototype.list = function (user, req, res) {
    TranStepLog.find({server_ref: req.server_ref} ,function (err, result) {
        res.send({code:'00', message: 'success', data: result});
    });
};

module.exports = handler;
