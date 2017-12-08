
var TranStepLog   =   require('../../model/TranStepLog-model');
/*
    EACH STEP WILL HAVE ITS OWN TRANSACTION LOG FOR
    REQUEST RESPONSE & ERRORS ETC
 */
function Logger(){

}
Logger.prototype.createStepLog  =   function(server_ref, step_name, step_number, request, options,handler, callback){
    var log                 =   new TranStepLog();
    log.server_ref         =   server_ref;
    log.step_name           =   step_name;
    log.request             =   request;
    log.step_position       =   step_number;
    log.req_options         =   options;
    log.request_date        =   Date.now();
    log.handler_name        =   handler.handlerPath;
    log.parser_name         =   handler.parserPath;
    log.save(function(err, log){
        return callback(err, log);
    });
};
Logger.prototype.updateStepLog  =   function(server_ref, step_name, result, response,  callback){
    TranStepLog.findOne({server_ref:server_ref, step_name:step_name}, function(err, doc){
        if(!err && doc){
            doc.response            =   result;
            doc.message             =   response.message;
            doc.step_data           =   response.data;
            doc.response_code       =   response.code;
            //doc.step_position       =   step_number;
            doc.response_date       =   Date.now();
            doc.save(function(err){
                return callback(err);
            });
        }else{
            return callback('#step.update.server_ref.invalid');
        }
    });
};
Logger.prototype.listStepLogs  =   function(server_ref, callback){
    TranStepLog.find({server_ref:server_ref}, function(err, logs){
        callback(err, logs);
    });
};
module.exports  =   Logger;
