

var async = require('async');

var TranHandler = require('./TranHandler');
var User = require('../../../model/User-model');
var Language = require('../../../model/Language-model');
var Role            =   require('../../../model/Role-model');

var handler = new TranHandler();

handler.processStep = function (uri, headers, action, payload, callback) {

    switch (action) {
        case 'list_users':
            async.waterfall([
                function preareQuery(next){
                    try{
                        payload.query = JSON.parse(payload.query);
                        next(null, payload.query);
                    }catch(err_message){
                        next(null, payload.query);
                    }
                },
                function getusers(query, next){
                    User.find(query).populate('roles', 'name').exec(function(err, users){
                        if(err){
                            next(err, null);
                        }else{
                            next(null, users);
                        }
                    })
                }
            ],function done(error, result){
                if(error){
                    callback({code: '06', message: error}, null);
                }else{
                    callback(null, {code: '00', message: 'list.users.success', data:result});
                }
            });
            break;
        default:
            callback({code: '06', message: '#payload.action.invalid'}, null);
    }
};

module.exports = handler;
