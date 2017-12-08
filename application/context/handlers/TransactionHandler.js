var Model = require('../../../model/index');
var TransType = Model.TranType;
var User = Model.User;
var S = require('string');
var async = require('async');
var params_mapper = require('./helper/params_mapper');

module.exports = function (user, req, res, properties) {
    var session = req.session;
    var processor = null;
    async.waterfall([
        function (next) {
            if (session && session.channel && session.application) {
                next();
            } else {
                next('#transaction.enrty.invalid');
            }
        },
        function preStart(next) {
            processor = properties.trans_processor;
            next(processor === null ? '#transaction.processor.ntf' : null);
        },
        function doTranType(next) {
            TransType.findOne({code: req.trans_type}, function (err, trans_type) {
                if (!err && trans_type) {
                    next(null, trans_type);
                } else {
                    next('#transaction.type.ntf');
                }
            });
        },
        function doOptions(trans_type, next) {
            params_mapper.mapParams(user._id, req, trans_type.requestMapper.mapper || {}, function (err, result) {
                if (!err && result) {
                    next(null, result, trans_type);
                } else {
                    next(err);
                }
            });
        },
        function doCreateTransaction(options, trans_type, next) {
            next(null, {}, options, trans_type);
        },
        function doHandleTransaction(tran, options, trans_type, next) {
            var trans_params = trans_type.trans_params || {};
          try {
            options.user_language = user.language;
            options.user_id = user._id;
          } catch (e) {
            //
          }
            var isSERVER = false;
            processor.startTransaction(/*tran.server_ref,*/user, trans_type, options, trans_params, tran._id, isSERVER, session, function (err, results) {
                if (!err && results) {
                    next(null, results);
                } else {
                    next(null, err);

                }
            });
        }
    ], function done(err, result) {
      processor = null;
        if (!err && result) {
            res.send(result);
        } else {
            res.send({code: '08', message: err});
        }
    });
};
