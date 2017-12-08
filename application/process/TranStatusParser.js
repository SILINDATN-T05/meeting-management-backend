
var async           =   require('async');
var TranLog         =   require('../../model/TranStepLog-model');
var TranFlow        =   require('../../model/TransactionFlow-model');

function TransStatusParser() {

}
TransStatusParser.prototype.parseFinalStatus    =   function (flow, server_ref, options, callback) {
    var params  =   {};
    var _code = '';
    var _message = '';
    async.waterfall([
        function _conditions(next) {
            TranFlow.findOne({_id: flow}, function (err, doc) {
                next(err, doc.result_conditions);
            });
        },
        function _tran_logs(conditions, next) {
            TranLog.find({server_ref:server_ref}, function (err, docs) {
                if(!err && docs){
                    async.eachOf(docs, function (param, key, cb) {
                        params[param.step_name] =   {
                            code:param.response_code,
                            message:param.message,
                            step_data:param.step_data};
                            _message = param.message;
                            _code = param.response_code;
                        cb();
                    }, function _done() {
                        var result = {
                            code:_code,
                            message:_message
                        }
                        next(null,result, conditions);
                    });
                }else{
                    next(err);
                }
            });
        },
        function _evaluate(result, conditions, next) {
            var expression       =   'var data        =' +JSON.stringify(params) +';'+
                'var options     =' +JSON.stringify(options) +';'+
                'var result      =' +JSON.stringify(result) +';' +
                conditions+';  return(result);';
            var evalResult  =   Function(expression)();
            next(null, evalResult);
        }
    ],
    function _done(err, result) {
        if(!err && result){
            callback(result);
        }else{
            callback({code:'06', message:err});
        }
    });
};
module.exports  =   new TransStatusParser();
