
var TransactionType     =   require('./../../model/TransactionType-model');
var StepLog             =   require('./../../model/TranStepLog-model');
var async               =   require('async');
var S                   =   require('string');

function Builder(){

}
Builder.prototype.buildTransactionResponse   =   function(tran_type, server_ref, callback){
    var self    =   this;
    async.parallel({
        mapper: function(cb){
            TransactionType.findOne({_id: tran_type}, function(err, doc){
                if(!err && doc){
                    cb(err, doc.responseMapper);
                }else{
                    cb('#transaction.build_response.invalid.mapper');
                }
            });
        }, log: function(cb){
            StepLog.find({server_ref: server_ref}, function(err, logs){
                if(!err && logs){
                    var data    =   {};
                    async.eachSeries(logs, function(log, next){
                       // console.log('TransactionStepResultBuilder',log);
                        data[log.step_name] =   log;
                        next();
                    }, function __done(){
                        cb(null, data);
                    });
                }else{
                    cb('#transaction.build_response.invalid.data');
                }
            });
        }}, function done(err, result){
        if(!err && result.mapper && result.log){
            self.extractLogData(result.mapper, result.log, function(err, response){
                response.data.server_ref    =   server_ref;
                callback(err, response);
            });
        }else{
            callback({code:'06', message:err.message});
        }
    });
};
Builder.prototype.buildResponse =   function(mapper, data, parser, callback){
    var self    =   this;
    async.waterfall([
        function parseResult(next){
            if(parser && parser['parseResult']){
                parser.parseResult(data, mapper, function(result){
                    next(null, result);
                });
            }else{
                next('#step_result.parser.failed');
            }
        }
    ], function done(err, result){
        callback(err, result);
    });
};
Builder.prototype.extractLogData =   function(mapper, data, callback){
    //console.log('Responsebuilder');
    var response    =   {code:'00', message:'success', data:{}};
    async.forEachOf(mapper, function doProcess(map, step, cb){
        async.forEachOf(map, function process(param, name, next){
            var log_data    =   data[step];
           // console.log(log_data);
            if(log_data){
                if(param.indexOf('|')>-1) {
                    var parts           =   param.split('|');
                    var value           =   log_data.step_data[parts[0]];
                    response.data[name] =   value ? value.split('|')[parts[1]] : '';
                }else if(param.indexOf('~')>-1){
                    var parts           = param.split('~');
                    var value           = log_data.step_data[parts[0]];
                    response.data[name] = value ? value.split('~'): [];
                }else{
                    response.data[name]      =   log_data.step_data[param];
                }
                response.code       =   log_data.response_code;
                response.message    =   log_data.message;
            }
            next();
        }, function _done(){
            cb();
        });
    }, function done(){

        //debugging

        return callback(null, response);
    });
};
Builder.prototype.extractSimpleData =   function(mapper, data, callback){
    var response    =   {};
    data            =   data||{};
    async.forEachOf(mapper, function process(param, name, cb){
        if(typeof  param ==='object'){
            async.forEachOf(param, function process(param1, name1, sb){
                response[param1]   =  data[name1];
                sb();
            }, function fn(){
                cb();
            });
        }else{
            response[param]   =  data[name];
            cb();
        }
    }, function _done(){
        return callback(null, response);
    });
};
Builder.prototype.extractData =   function(mapper, data, callback){
    var response    =   {};
    data            =   data||{};
    async.forEachOf(mapper.data, function process(value, i, cb){
        async.forEachOf(value, function process(param, name, _cb){
            if(param.indexOf('|')>-1){
                var parts            =   param.split('|');
                response[parts[0]]   =  data[name].split('|')[parts[1]];
            }else{
                response[param]   =  data[name];
            }
            _cb();
        }, function _y(){
            cb();
        });

    }, function _done(){
        return callback(null, response);
    });
};
module.exports  =  Builder;
