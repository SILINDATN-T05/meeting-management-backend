
var async           =   require('async');
var TranHandler     =   require('./TranHandler');
var User            =   require('../../../model/User-model');
var helper          =   require('./helper/query_helper');
var handler         =   new TranHandler();


handler.processStep =   function(uri, headers, action, payload, callback){
    async.waterfall([
            function doUser(next) {
                if(payload.user && payload.user._id){
                    next(null, payload.user);
                }else{
                    next('#model_remove.user.invalid');
                }
            },
            function doModel(user, next) {
                var Model   =   require('./../../../model/'+payload.model+'-model');
                if(Model){
                    next(null, Model, user);
                }else{
                    next('#model_remove.'+payload.model+'.model.invalid');
                }
            },
            function doQuery(Model, user, next) {
                if(payload.query){
                    helper.prepare(payload.query, function (err, query) {
                        next(err, query, Model, user);
                    });
                }else{
                    next('#model_remove.query.invalid');
                }
            },
            function doRemove(query, Model, user, next) {
                Model.find(query,function(err, model){
                    async.forEachOfSeries(model,function(m,i,cb)
                    {
                        if(payload.override && payload.override){
                            m.remove(user, {override:true}, function (err) {
                                if(!err){
                                    cb();
                                }else{
                                    cb('#model_remove.process.failed');
                                }
                            });
                        }else{
                            m.remove(user, function (err) {
                                if(!err){
                                    cb();
                                }else{
                                    cb('#model_remove.process.failed');
                                }
                            });
                        }
                    },function done(err)
                    {
                        next('#model_remove.process.failed');
                    })

                });
            }
        ],
        function (err, result) {
            if(!err){
                callback(null, {code:'00', message:'success', data: result});
            }else{
                callback(null, {code:'06', message:err});
            }
        });
};
module.exports  =   handler;
