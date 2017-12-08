
var Tran            =   require('../../../model/SERVERTransaction-model');
var async           =   require('async');
var TranHandler     =   require('./TranHandler');
var handler         =   new TranHandler();
/*
  payload   =   {
    server_ref: 123,
    params:{
            amount:123
        }
    }
 */
handler.processStep =   function(uri, headers, action, payload, callback){
    async.waterfall([
        function _validate(next) {
            if(payload && payload.server_ref && payload.params){
                next(null, payload.server_ref, payload.params);
            }else{
                next('#handler.tran-updater.payload.invalid');
            }
        },
        function _tran(server_ref, params, next) {
            Tran.findOne({server_ref:server_ref}, function (err, doc) {
                if(!err && doc){
                    next(err, doc, params);
                }else{
                    next('#handler.tran-updater.trans.invalid');
                }
            });
        },
        function _update(trans, params, next) {
            async.forEach(params, function (param, key, cb) {
                trans[key]  =   param;
                cb();
            }, function _done() {
                trans.save(function (err) {
                    next(err);
                });
            });
        }
    ],
    function (err) {
        if(!err){
            callback(null, {code:'00', message:'success'});
        }else{
            callback(null, {code:'06', message:err});
        }
    });
};
module.exports  =   handler;
