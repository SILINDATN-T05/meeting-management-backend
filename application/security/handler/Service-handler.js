
var async           =   require('async');
var helper          =   require('./helper/params_mapper');
var TranType        =   require('../../../model/TransactionType-model');
var SERVERTransaction  =   require('../../../model/SERVERTransaction-model');


function ServiceHandler() {

}
ServiceHandler.prototype.handleAction  =   function (user, data, session, application, route, transactionManager, res) {
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
            helper.mapParams(data, trans_type.requestMapper.mapper, function (err, result) {
                next(err,result, trans_type);
            });
        },
        function doTransaction(result, trans_type, next) {
                var trans           =   new SERVERTransaction();
                trans.channel       =   application.channel;
                trans.application   =   application.code;
                trans.session       =   session;
                trans.router        =   route;
                trans.save(function (err, transaction) {
                    if(!err && transaction){
                        next(null, transaction, result, trans_type, session._id);
                    }else{
                        console.error(err);
                        next('#service.trans.init.failed');
                    }
                });
        },
        function handleTransaction(transaction, options, trans_type, session_id, next) {
            var isSERVER   =   true;
            transactionManager.startTransaction(user, trans_type, options, {}, transaction._id, isSERVER, session_id, function(response){
                if(response.code === "06")
                {
                    next(response,transaction, null);
                }else
                {
                    next(null,transaction, response);
                }

            });
        },
        function updateRef(transaction,response,next)
        {
            if(response.data) {
                transaction.server_ref = response.data.server_ref;
            }

            transaction.save(function(err,info)
            {
                next(null, response);
            })
        }
    ],
    function done(err, result) {

        if(!err && result){
            res.send(result);
        }else{
            if(err) {
                if(err.data) {
                    res.send({code: '06', message: err.message || '#service.message.empty', data: err.data || {} });
                } else {
                    res.send({code: '06', message: err.message || '#service.message.empty', data: {}, error: err});
                }
            } else {
                res.send({code: '06', message: '#service.message.empty', data: {}});
            }
        }
    });
}
module.exports  =   new ServiceHandler();
