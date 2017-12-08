
var Model               =   require('../../../model/index');
var TransType           =   Model.TranType;
var Tran                =   Model.Transaction;
var async               =   require('async');
var params_mapper       =   require('./helper/params_mapper');
var logger              =   require('winston');

module.exports  =   function(user, req, res, properties){
    var processor   =   null;
    var server_ref =   req.server_ref;
    async.waterfall([
        function doProcessor(next){
            processor       =  properties.trans_processor;
            next(processor === null? '#transaction.processor.ntf':null);
        },
        function doTransaction(next){
            Tran.findOne({server_ref:server_ref}, function(err, tran) {
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
                        //params_mapper.mapParams(user.customer,req, trans_type.requestMapper.mapper||{}, function(key, result){
                    params_mapper.mapParams( user._id || user, req, params, function(key, result){
                        if(!key && result){
                            next(null, result, tran);
                        }else{
                            logger.error('_________________________>>>', key);
                            next('#trans.step.options.required.'+key);
                        }
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

            //debugging
            //console.log('TransactionEnquiryHandler result:',result);
            //console.log('TransactionEnquiryHandler err:',err);

            if(!err && result){
                res.send(result);
            }else{
                res.send({code: '06', message: err});
            }
        });
};
