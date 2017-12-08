
var async               =   require('async');
var helper              =   require('./helper/params_mapper');
var TransType           =   require('../../../model/TransactionType-model');
var SERVERTransaction      =   require('../../../model/SERVERTransaction-model');


function ServiceHandler() {

}
ServiceHandler.prototype.handleAction  =   function (server_ref, data, processor, res) {
    async.waterfall([
            function doTransaction(next){
                SERVERTransaction.findOne({server_ref:server_ref}, function(err, tran) {
                    if(!err && tran) {
                        next(null, tran);
                    }else{
                        next('#tran.proceed.ntf');
                    }
                });
            },
            function locateProcess(tran, next) {
                processor.locateProcess(tran._id, function (err, trans_type, current_step) {
                    if(!err){
                        next(null, trans_type, current_step, tran);
                    }else{
                        next(err);
                    }
                });
            },
            function doTranType(trans_type, current_step, tran, next){
                TransType.findOne({_id: trans_type}, function (err, trans_type) {
                    if(!err && trans_type){
                        next(null, trans_type, current_step, tran);
                    }else{
                        next('#tran.trans_type.ntf');
                    }
                });
            },
            function doOptions(trans_type, current_step, tran, next){
                trans_type.locateStepInteractions(current_step, function (err, params) {
                    if(!err && params){
                        helper.mapParams(data, params, function (err, result) {
                            next(null, result, tran);
                        });
                    }else{
                        next('#trans.step.options.invalid.'+current_step+'.'+trans_type.code);
                    }
                });
            },
            function doHandle(options, tran, next){
                processor.resumeTranProcess(tran._id, options, function (result) {
                    next(null, result);
                });
            }
        ],
        function done(err, result){
            if(!err && result){
                res.send(result);
            }else{
                res.send({code: '06', message: err});
            }
        });
}
module.exports  =   new ServiceHandler();
