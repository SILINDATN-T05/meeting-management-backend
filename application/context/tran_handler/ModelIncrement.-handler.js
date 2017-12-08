
var async           =   require('async');
var TranHandler     =   require('./TranHandler');
var User            =   require('../../../model/User-model');
var handler         =   new TranHandler();

handler.processStep =   function(uri, headers, action, payload, callback){
    async.waterfall([
            function doUser(next) {
                if(payload.user && payload.user._id){
                    next(null, payload.user);
                }else{
                    next('#model_increment.user.invalid');
                }
            },
            function doModel(user, next) {
                var Model   =   require('./../../../model/'+payload.model+'-model');
                if(Model){
                    next(null, Model, user);
                }else{
                    next('#model_handler.'+payload.model+'.model.invalid');
                }
            },
        function doQuery(Model, user, next) {
            if(payload.query){
                helper.prepare(payload.query, function (err, query) {
                    next(err,query , Model, user);
                });
            }else {
                next('#model_updater.query.invalid');
                }
            },

            function doUpdate(query, Model, user, next) {
                if(payload.model==="AuthDetail")
                {
                    service.encrypt(payload.update.hash, function (err, hash) {
                        if(!err && hash){
                            payload.update.hash=  hash;
                        }
                    });
                }
                Model.findOne(query,function(err,data){
                    if(!err && data){
                        async.forEachOf(payload.update, function(value, key, cb){
                            data[key]=value;
                            cb()
                        },function done(){
                            data.persist(user, function (err, data) {
                                next(err, {code:'00', message:'success', data: data});
                            });
                        })
                    }else{
                        next(err);
                    }
                });
            }
        ],
        function (err, result) {
            if(!err && result){
                callback(null, result);
            }else{
                callback(null, {code:'06', message:err});
            }
        });
};
module.exports  =   handler;

