
var Model                       =   require('../../../model/index');
var log4js                      =   require('log4js');
var logger                      =   log4js.getLogger('TRAN_TYPE_HANDLER');
var TransactionHandler          =   Model.TransactionHandler;
var TransactionFlowStep         =   Model.TransactionFlowStep;
var HandlerLocator              =   require('../tran_handler/HandlerLocator');
var ParserLocator               =   require('../response_parser/ParserLocator');
var handlerLocator              =   new HandlerLocator();
var parserLocator               =   new ParserLocator();

var handler = function () {};

handler.prototype.listHandlers =   function(user, req, res){
    res.send({code:'00', message:'success', data:handlerLocator.listHandlers()});
};

handler.prototype.listParsers =   function(user, req, res){
    res.send({code:'00', message:'success', data:parserLocator.listParsers()});
};
//========= TRANSACTION FLOWS ===============//
handler.prototype.list =   function(user, req, res){
    TransactionFlowStep.find({}, function(err, info){
        if(err) {
            logger.error(err);
        }
        res.send({code:'00', message:'success', data:info});
    });
};
//================ END FLOWS =================//
handler.prototype.listTransactionHandler =   function(user, req, res){
    TransactionHandler.find({}, function(err, info){
        if(err) {
            logger.error(err);
        }
        res.send({code:'00', message:'success', data:info});
    });
};
handler.prototype.saveTransactionHandler = function (user, req, res) {
    var transactionHandler = new TransactionHandler(req);
    transactionHandler.persist(user, function (err, info) {
        if(err) {
            res.send({code: '06', message: err.message });
        }else{
            res.send({code: '00', message: 'success', data: info});
        }
    });
};
handler.prototype.create =   function(user, req, res){
    var transactionFlowStep = new TransactionFlowStep(req);
    transactionFlowStep.persist(user, function (err, info) {
        if(err) {
            res.send({code: '06', message:err.message});
        }else{
            res.send({code: '00', message: 'success', data: info});
        }
    });
};
handler.prototype.edit =   function(user, req, res){
    var flowStepID             =   req.flowStepID;
    var flowStepName           =   req.flowStepName;
    var desc                =   req.description;

    TransactionFlowStep.findOne({_id: flowStepID}, function(err, doc){
        if(!err && doc){
            TransactionFlowStep.findOne({name:flowStepName, description:desc}, function(err, other){
                if(err) {
                    logger.error(err);
                }
                if(other){
                    res.send({code:'06', message:'#TransactionFlowStep.update.exists'});
                }else{
                    doc.name = flowStepName;
                    doc.description = desc;
                    doc.persist(user, function(err, doc){
                        if(!err && doc){
                            res.send({code:'00', message:'success'});
                        }else{
                            res.send({code:'06', message:'#TransactionFlowStep.update.failed'});
                        }
                    });
                }
            });
        }else{
            res.send({code:'06', message:'#TransactionFlowStep.update.failed'});
        }
    });
};
handler.prototype.delete = function (user, req, res) {
    var id                 =    req.flowId;
    TransactionFlowStep.findOne({_id: id}, function (err, doc) {
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

