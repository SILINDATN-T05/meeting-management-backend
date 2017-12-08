
var async           =   require('async');
var log4js          =   require('log4js');
var TranHandler     =   require('./TranHandler');
var ConfigService   =   require('../../../engine/ConfigService');
var handler         =   new TranHandler();
var configService   =   new ConfigService();

//var logger          =   log4js.getLogger('CONFIG_SERVER-HANDLER');
//var factory         =   require('../../../model/factory/CustomerFactory');
//var KYC             =   require('../../../model/KYC-model');
//var Lang            =   require('../../../model/Language-model');
//var User            =   require('../../../model/User-model');

/*
 payload   = {
    config_name: TEST_CONFIG
 }
 */
handler.processStep =   function(uri, headers, action, payload, callback){
    async.waterfall([
        function _validate(next) {
            if(payload && payload.config_name !== undefined){
                next(null, payload.config_name);
            }else{
                next('#tran_handler.config_server.payload.invalid');
            }
        },
        function _locateConfig(config_name, next) {
            config_name = config_name.toUpperCase();
            if (payload.user) {
                configService.locateupdate(config_name, payload.user, function (err, config) {
                    if (!err && config && config.value) {
                        next(null, config.value, config.refcount);
                    } else {
                        next(err || '#tran_handler.config_server.ntf');
                    }
                });
            }
            else {
                configService.locate(config_name, function (err, config) {
                    if (!err && config && config.value) {
                        next(null, config.value, config.refcount);
                    } else {
                        next(err || '#tran_handler.config_server.ntf');
                    }
                });
            }
        }
    ],
    function _done(err, result, referenceCount) {
        result.refCount = referenceCount;
        if(!err && result){
            callback({code:'00', message:'success', data:result});
        }else{
            callback({code:'06', message:err});
        }
    });
};
module.exports  =   handler;
