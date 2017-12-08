
var async                      =   require('async');
var userModel                       =   require('../../../model/User-model');
var applicationModel                =   require('../../../model/Application-model');
var organization                =   require('../../../model/Organisation-model');
var authDetails                =   require('../../../model/AuthDetail-model');
var TranType                =   require('../../../model/TransactionType-model');
var SERVERTransaction                =   require('../../../model/SERVERTransaction-model');
var Session                =   require('../../../model/Session-model');
var hashService                =   require('../../../engine/HashService');
var helper                =   require('./helper/params_mapper');
function APIHandler() {

}
/*
    route={action:CUST_INST, trans_type:CIS001, }
 */
APIHandler.prototype.handleAction = function(user, isom, application, route, transactionManager, callback){
    //---- start sample
    async.waterfall([
            function loadTransType(next) {
                TranType.findOne({code: route.tran_type}, function (err, trans_type) {
                    if(!err && trans_type){
                        next(null, trans_type);
                    }else{
                        next('#route.trans_type.invalid');
                    }
                });
            },
            function paramsMaps(trans_type, next) {
                var params =  trans_type.requestMapper.mapper;
                params["session"] = 'session';
                helper.mapParams(isom,params, function (err, result) {
                    next(err,result, trans_type);
                });
            },
            function doTransaction(result, trans_type, next) {
                result["user"] = user._id;
                var trans           =   new SERVERTransaction();
                trans.channel       =   application.channel;
                trans.application   =   application.code;
                trans.router        =   route;
                trans.save(function (err, transaction) {
                    if(!err && transaction){
                        next(null, transaction, result, trans_type);
                    }else{
                        next('#service.trans.init.failed');
                    }
                });
            },
            function handleTransaction(transaction, options, trans_type, next) {
                 Session.findOne({_id:options.session},function(err,session)
                {
                    transactionManager.startTransaction(/*transaction.server_ref,*/user, trans_type, options, {}, transaction._id, true,session, function(err, results){
                        if(!err && results){
                            next(null, results);
                        }else{
                            next(null, err);

                        }
                    });
                })
            }
        ],
        function done(err, result) {
            if(!err && result){
                callback(result);
            }else{
                callback({code: '06', message: err});
            }
        });
    //------- end sample
}
//user,data.orgID,data.application,
APIHandler.prototype.authenticateUser = function(user,orgID,application,callback){

    /*console.log('APIHandler|user:',JSON.stringify(user));
    console.log('APIHandler|orgID:',JSON.stringify(orgID));
    console.log('APIHandler|application:',JSON.stringify(application));*/

    authDetails.findOne({uuid:user.sourceid,organizationID:orgID,channel:"WEBSERVICE"},function(err,info)
    {
        if(!err && info)
        {
            userModel.findOne({_id:info.user},function(err,users)
            {
                if(!err && users)
                {
                    hashService.compare(user.password,info.hash,function(err,match)
                    {
                        if(!err && match===true)
                        {
                            organization.findOne({organisationName:orgID},function(err,org)
                            {
                                if(!err && org)
                                {
                                    applicationModel.findOne({code:application,organizationID:orgID,channel:"WEBSERVICE"},function(err,app)
                                    {
                                        callback(err,users,org,app);
                                    })
                                }else
                                {
                                    callback(err);
                                }
                            })
                        }else
                        {
                            callback(err);
                        }
                    })
                }else
                {
                    callback(err);
                }
            })
        }else
        {
            callback(err);
        }
    })
};
module.exports  =   new APIHandler();
