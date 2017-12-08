
var async           =   require('async');
var TranHandler     =   require('./TranHandler');
var User            =   require('../../../model/User-model');
var router = require('../../context/comms/Router');
var handler         =   new TranHandler();
/*
 payload  =   {
     model: 'Bank',
     query:{
         owner:xyz,
         accountNumber: abc,
         default_account: true,
         bank:
     }
 }
 */
handler.processStep =   function(uri, headers, action, payload, callback){
        var res = {
            json: function (data) {
                if (data.code && data.message) {
                    callback(data);
                } else {
                    callback({code: '06', message: '#api.proxy.invalid_response'});
                }
            }
        };
        var req = {
            body: {
                user: user,
                session: {}//override will do the same
            },
            path: 'server/' + payload.path
        };
        router.route(payload, req, res, null, org._id);
};
module.exports  =   handler;
