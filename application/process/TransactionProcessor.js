var mongoose = require('mongoose');
// var models = mongoose.modelNames();
// console.log(models['User']);
var bpmn                    =   require('bpmn');
var merge                   =   require('merge-util');
var async                   =   require('async');
var Flow                    =   require('./../../model/TransactionFlow-model');
var Transaction             =   require('./../../model/Transaction-model');
var S                       =   require('string');
var TranProcessManager      =   require('./TranProcessManager');
var SERVERTransaction          =   require('./../../model/SERVERTransaction-model');
var merger                  =   require('merge-util');//merge-util
var tran_names              =   [];
var flowBuilder             =   require('./FlowBuilder');
var _  =   require('underscore');
var tranProcessManager      =   new TranProcessManager();

function TransactionProcessor(options){
    tranProcessManager  =   new TranProcessManager(options);
}
TransactionProcessor.prototype.startTransaction =   function(user,tran_type, options, trans_params, process_id, isServer, session, callback){
    var process_name    =   tran_type.pross_name;
    async.waterfall([
            function doFlow(next){
               Flow.findOne({_id:tran_type.tran_flow}, function(err, flow){
                    if(!err && flow){
                        next(null, flow);
                    }else{
                        next('process.tran.flow.invalid');
                    }
                });
            },
            function prepare(flow, next){
                 if(tranProcessManager.processDefinitionExist(tran_type.pross_name)){
                    next(null, flow);
                }else{
                    async.waterfall([
                            function _buildBPMN(move){
                                flowBuilder.buildProcess(tran_type, flow, function(err, xml, handler){
                                    move(err, xml, handler);
                                });
                            },
                            function _bindProcess(xml, handler, move){
                                tranProcessManager.addBPMN(tran_type.pross_name, xml, handler, function(err){
                                    move(err);
                                });
                            }
                        ],
                        function _done(err){
                            next(err, flow);
                        });
                }
            },
            function createProcess(flow, next){
                tranProcessManager.createProcess(tran_type.pross_name, function(err, pross, tran){
                    if(!_.isEmpty(options))
                    {
                        for(var name in options){
                            tran[name]  =   options[name];
                        }
                        options.channel             =   session.channel ? session.channel: null;
                        tran.user                   =   user._id?user._id:null;
                        tran.transaction_type       =   tran_type._id ?tran_type._id: null;
                        tran.channel                =   session.channel ?session.channel:null;
                        tran.application            =   session.application ?session.application:null;
                        tran.request_date           =   Date.now();
                         tran.save(function (err, tran) {
                            next(err, tran.server_ref,  flow, pross);
                        });
                    }else
                    {
                        next(err, tran.server_ref,  flow, pross);
                    }


                });
            },
            function timeouts(server_ref, flow, process, next){
                flowBuilder.buildTimers(flow, function(err, timers){
                    process.setCurrentStep('START');
                    process.setFlow(flow._id);
                    process.setServerRef(server_ref);
                    process.setTransType(tran_type._id);
                    process.setOptions(options);
                    process.setTransCode(tran_type.code);
                    process.setCaller(callback);
                    process.setFlowExtras(flow.extras);
                    process.setTransParams(trans_params);
                    process.setSession(session);
                    if(flow.transaction_map&&!isEmpty(flow.transaction_map))
                    {
                        process.setTranMap(flow.transaction_map);
                        process.updateMap(process.getOptions());
                    }
                    process.setGlobalTimeout(flow.global_timeout);

                    if(isServer && isServer===true){
                        process.setSERVER();
                    }else{
                      process.setUser(user._id);
                    }
                    process.addTimeOuts(timers, function(){
                        next(null, process);
                    });
                });
            },
            function doTemplates(process, next){
                var templates   =   {};
                async.forEachOf(process.getOptions(), function i(value, key, cb){
                    if(value && S(value).startsWith('#')){
                        templates[key]      = S(value).chompLeft('#').s;
                    }
                    cb();
                }, function _t(){
                    process.setTemplateOptions(templates);
                    next(null, process);
                });
            }
        ],
        function done(err, pross){
            if(!err && pross){
                if(tran_type && tran_type.async && tran_type.async === true){
                    pross.setCaller(function (data) {

                    });
                    callback({code:'00', message:'success', data: trans});
                    pross.doStart();
                }else{
                    pross.setCaller(callback);
                    pross.doStart();
                }
            }else{
                callback({code:'06', message:err});
            }
        });
};
TransactionProcessor.prototype.doLocateProcess  =   function(tran_id, callback){
    async.waterfall([
            function _tran(next){
               Transaction.findOne({_id: tran_id}, function(err, tran){
                    if(!err && !tran)
                    {
                        SERVERTransaction.findOne({_id: tran_id}, function(err, tran){
                            next(err, tran);
                        })
                    }else
                    {
                        next(err, tran);
                    }

                });
            },
            function _process(tran, next){
                tranProcessManager.locateProcess(tran.server_ref, function(err, process){
                    callback(err, process);
                });
            }
        ],
        function done(err, process){
            callback(err, process);
        });
};
TransactionProcessor.prototype.locateProcess     =  function(tran_id, callback){
    var self    =   this;
    self.doLocateProcess(tran_id, function(err, process){
        if(!err && process){
            callback(null, process.getTransType(), process.getCurrentStep());
        }else{
            callback(err);
        }
    });
};
TransactionProcessor.prototype.resumeTranProcess = function(tran_id, options, callback){
    var self    =   this;
    async.waterfall([
            function _process(next){
                self.doLocateProcess(tran_id, function(err, process){
                    next(err, process);
                });
            },
            function _update(process, next){
                process.updateOptions(options);
                process.setCaller(callback);
                next(null, process);
            }
        ],
        function done(err, process){
            if(!err && process){
                process.markDone();
            }else{
                callback({code:'06', message:err});
            }
        });
};
function isEmpty(obj) {
    for(var prop in obj) {
        if(obj.hasOwnProperty(prop))
            return false;
    }

    return JSON.stringify(obj) === JSON.stringify({});
}

module.exports  =   TransactionProcessor;
