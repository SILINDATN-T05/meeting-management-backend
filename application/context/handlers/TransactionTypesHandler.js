
var Model                       =   require('../../../model/index');
var log4js                      =   require('log4js');
var logger                      =   log4js.getLogger('TRAN_TYPE_HANDLER');
var TransactionType             =   Model.TranType;
var async                       =   require('async');
var helper                      =   require('./helper/trans_types');
var ParserLocator               =   require('../response_parser/ParserLocator');
var parserLocator               =   new ParserLocator();

var handler                     =   function() {};

handler.prototype.create =   function(user, req, res){
    var trans_type          =   new TransactionType();
    trans_type.name         =   req.name;
    trans_type.code         =   req.code;
    trans_type.description  =   req.description;

    helper.locate_flow(req.tran_flow,  function(err, flow){
        if(!err){
            trans_type.tran_flow     =   flow;
            helper.request_mapper(req.requestMapper, function(err, mapper){
                if(!err && mapper){
                    trans_type.requestMapper    =   mapper;
                    helper.response_mapper(req.responseMapper, flow, function(err, mapper){
                        if(!err && mapper){
                            trans_type.responseMapper = mapper;
                            trans_type.persist(user, function (err, doc) {
                                if(!err && doc) {
                                    res.send({code: '00', message: 'success', data: doc});
                                }else{
                                    res.send({code: '06', message: err.message});
                                }
                            });
                        }else{
                            res.send({code:'06', message:err});
                        }
                    });
                }else{
                    res.send({code:'06', message:err});
                }
            });
        }else{
            res.send({code:'06', message:err});
        }
    });
};
handler.prototype.list =   function(user, req, res){
    TransactionType.find({}, function(err, info){
        if(err) {
            logger.error(err);
        }
        res.send({code:'00', message:'success', data:info});
    });
};
handler.prototype.map =   function(user, req, res){
    async.parallel({tran_types: function(next){
        TransactionType.find({}, function(err, docs){
            if(!err && docs){
                next(null, docs);
            }else{
                next('#transtype.map.failed');
            }
        });
    }}, function done(err, result){
        if(!err && result.tran_types){
            var data    =   [];
            async.eachSeries(result.tran_types, function(tran_type, cb){
                data.push({name:tran_type.name, code:tran_type.code});
                cb();
            }, function finished(){
                res.send({code:'00', message:'success', data:data});
            });
        }else{
            res.send({code:'06', message:err});
        }
    });
};
handler.prototype.delete = function (user, req, res) {
    TransactionType.findOne({_id: req.flow}, function (err, doc) {
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

handler.prototype.edit =   function(user, req, res){
    TransactionType.findOne({_id:req._id}, function(err, tran_type){
        if(!err && tran_type){
            var flows   =   tran_type.past_tran_flows;
            if(tran_type.tran_flow !== req.tran_flow){
                flows.push({tran_flow:tran_type.tran_flow, user: user._id});
            }
            req.past_tran_flows =   flows;
            req.save(user, function(err, doc){
                if(!err && doc){
                    res.send({code: '00', message: 'success', data: doc});
                }else{
                    res.send({code:'06', message:'#trantype.edit.failed'});
                }
            });
        }else{
            res.send({code:'06', message:'#trantype.edit.find.invalid'});
        }
    });
};

handler.prototype.params =   function(user, req, res){
    TransactionType.findOne({code:req.code}, function(err, tran_type){
        if(!err && tran_type){
            var mapper  =   tran_type.requestMapper.mapper;
            var params  =   [];
            params.push(mapper[1].raw);
            res.send({code: '00', message: 'success', data: params});
        }else{
            res.send({code:'06', message:'#trantype.params.find.invalid'});
        }
    });
};

handler.prototype.interaction_params =   function(user, req, res){
    TransactionType.findOne({_id:req._id}, function(err, tran_type){
        if(!err && tran_type){
            res.send({code: '00', message: 'success', data: tran_type.requestMapper.interaction});
        }else{
            res.send({code:'06', message:'#trantype.interaction_params.find.invalid'});
        }
    });
};

handler.prototype.listParsers =   function(user, req, res){
    res.send({code:'00', message:'success', data:parserLocator.listParsers()});
};

module.exports  =   handler;

