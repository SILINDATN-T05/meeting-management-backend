
var Model                       =   require('../../../model/index');
var log4js                      =   require('log4js');
var logger                      =   log4js.getLogger('TRAN_TYPE_HANDLER');
var TransactionFlow             =   Model.TransactionFlow;
var FlowBuilder                 =   require('../../process/TransactionFlowBuilder');
var flowBuilder                 =   new FlowBuilder();

var handler = function () {};

handler.prototype.edit =   function(user, req, res){
    TransactionFlow.findOne({_id: req}, function(err, flow){
        if(!err && flow){
             var transactionFlow = new TransactionFlow(req);
             transactionFlow.persist(user, function(err, flow) {
                if(!err && flow){
                    res.send({code:'00', message:'success', data: flow});
                }else{
                    res.send({code:'06', message: '#tranflow.update.failed'});
                }
            });
        }else{
            res.send({code: '06', message: '#tranflow.find.invalid'});
        }
    });
};

handler.prototype.details =   function(user, req, res){
    TransactionFlow.findOne({_id: req}, function(err, flow){
        if(!err && flow){
            res.send({code:'00', message:'success', data: flow});
        }else{
            res.send({code: '06', message: '#tranflow.find.invalid'});
        }
    });
};

handler.prototype.create =   function(user, req, res){
    var transactionFlow = new TransactionFlow(req);
    transactionFlow.persist(user, function(err, flow) {
        if(err) {
            res.send({code: '06', message:err.message});
        }else{
            res.send({code: '00', message: 'success', data: flow});
        }
    });
};

handler.prototype.preview =   function(user, req, res){
    TransactionFlow.findOne({name:req.name}, function(err, flow) {
        if(!err && flow){
            flowBuilder.buildTransactionFlow(flow, function(err, xml, handlers){
                logger.debug(handlers);
                if(err){
                    res.send({code: '00', message: 'success', data:{xml:xml}});
                }else{
                    res.send({code: '06', message: err.message});
                }
            });
        }else{
            res.send({code: '06', message: '#tranflow.preview.invalid'});
        }
    });
};

handler.prototype.list =   function(user, req, res){
    TransactionFlow.find({}, function(err, info) {
        if(err) {
            logger.error(err);
        }
        res.send({code:'00', message:'success', data:info});
    });
};

handler.prototype.delete = function (user, req, res) {
    TransactionFlow.findOne({_id: req.flow}, function (err, doc) {
        if(err) {
            logger.error(err);
        }
        if(doc){
            doc.remove(user, function(err){
                if(err) {
                    logger.error(err);
                }
                res.send({code: '00', message: 'success', data: doc});
            });
        }else{
            res.send({code: '06', message: '#tranflow.remove.invalid'});
        }
    });
};

module.exports  =   handler;

