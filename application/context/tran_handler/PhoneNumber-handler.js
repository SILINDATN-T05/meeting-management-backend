
var PhoneNumber = require( 'awesome-phonenumber' );
var TranHandler     =   require('./TranHandler');
var handler         =   new TranHandler();
var async           =   require('async');
var ConfigService   =   require('../../../engine/ConfigService');
var handler         =   new TranHandler();
var configService   =   new ConfigService();
handler.processStep = function (uri, headers, action, payload, callback) {

    configService.locate(payload.config, function (err, config) {
        if (!err && config && config.value) {
            async.forEachOfSeries(config.value.countries,function(cn,i,cb)
            {
                var pn = new PhoneNumber( payload.msisdn, cn );
                if(pn.isValid())
                {
                    var phone = pn.getNumber();
                    cb(phone.substring(1,phone.length));
                }else
                {
                    cb();
                }
            },function done(number)
            {
                if(!number)
                {
                    return callback({code:'06', message:'fail'});
                }else
                {
                    return callback({code:'00', message:'success', data:number});
                }
            })
        } else {
            callback(err || '#tran_handler.config_server.ntf');
        }
    });
};
module.exports = handler;
