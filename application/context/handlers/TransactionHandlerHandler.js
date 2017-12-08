
var Model                       =   require('../../../model/index');
var ParserLocator               =   require('../response_parser/ParserLocator');
var HandlerLocator              =   require('../tran_handler/HandlerLocator');
var parserLocator               =   new ParserLocator();
var handlerLocator              =   new HandlerLocator();
var TransactionHandler          =   Model.TransactionHandler;
var logger                      =   require('winston');

function TransactionHandlerHandler(){

}
TransactionHandlerHandler.prototype.list =   function(user, req, res){
    TransactionHandler.find({}, function(err, info){
        if(err) {
            logger.error(err);
        }
        res.send({code:'00', message:'success', data:info});
    });
};

TransactionHandlerHandler.prototype.create = function (user, req, res) {
    var handler = new TransactionHandler(req);
    handler.persist(user, function (err, doc) {
        if(!err && doc) {
            res.send({code: '00', message: 'success', data: doc});
        }else{
            res.send({code: '06', message: '#trans_handler.create.failed'});
        }
    });
};

TransactionHandlerHandler.prototype.listParsers =   function(user, req, res){
    res.send({code:'00', message:'success', data:parserLocator.listParsers()});
};

TransactionHandlerHandler.prototype.listHandlers =   function(user, req, res){
    res.send({code:'00', message:'success', data:handlerLocator.listHandlers()});
};

TransactionHandlerHandler.prototype.edit =   function(user, req, res){
    var handlerId               =   req.handlerId;
    var HandlerName             =   req.HandlerName;
    var desc                    =   req.description;

    TransactionHandler.findOne({_id: handlerId}, function(err, doc){
        if(!err && doc){
            TransactionHandler.findOne({name:HandlerName, description:desc}, function(err, other){
                if(err) {
                    logger.err(err);
                }
                if(other){
                    res.send({code:'06', message:'#TransactionTemplate.update.exists'});
                }else{
                    doc.name = HandlerName;
                    doc.description = desc;
                    doc.persist(user, function(err, doc){
                        if(!err && doc){
                            res.send({code:'00', message:'success'});
                        }else{
                            res.send({code:'06', message:'#TransactionTemplate.update.failed'});
                        }
                    });
                }
            });
        }else{
            res.send({code:'06', message:'#TransactionTemplate.update.failed'});
        }
    });
};

TransactionHandlerHandler.prototype.delete = function (user, req, res) {
    var id                 =    req.handlerId;
    TransactionHandler.findOne({_id: id}, function (err, doc) {
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

module.exports  =   new TransactionHandlerHandler();

