
var async           =   require('async');
var locator         =   require('./FlowStepLocator');
var tranHandler     =   require('./ProcessTranHandler');
var serverHandler      =   require('./SERVERTranHandler');
/*
    NORMAL USER TASK
 */
var handleStep  =   function(process, callback){
    var handler =   (process.isSERVER() && process.isSERVER()=== true)? serverHandler: tranHandler;
    async.waterfall([
        function doFlow(next){
            var flow    =   process.getFlow();
            var name    =   process.getCurrentStep();
            locator.locateFlowStep(flow, name, function(err, step, conditions){
                next(err, step, conditions);
            });
        },
        function doHandle(step, conditions, next){
            handler.handleStep(step.tran_step, process, conditions, step.step_config, function (result) {
                next(result);
            });
        }
    ],
    function done(result){
        return callback(result);
    });
};
exports.task = function(options, next){
    var self   =   this;
    async.waterfall([
        function handle(fn){
            handleStep(self, function(){
                fn();
            });
        },
        function checkCaller(fn){
            var flow    =   self.getFlow();
            var name    =   self.getCurrentStep();
            locator.isAutoComplete(flow, name, function(sendResponse){
                fn((sendResponse && sendResponse===true)?sendResponse:null);
            });
        },
        function callCaller(fn){
            self.sendResponse(function(){
                fn();
            });
        }
    ],
    function done(sendResponse){
        if(sendResponse && sendResponse===true){
            self.markDone();
        }
        next(options);
    });
};
/*
    GATEWAY TASK
 */
exports.gateway = function(options, next){
    var self            =   this;
    async.waterfall([
        function handle(fn){
            handleStep(self, function(result){
                var eval_results    =   (result && result.code && result.code=='00');
                self.setCurrentEvalResult(eval_results);
                fn();
            });
        }
    ],
    function done(){
        next(options);
    });
};
exports.onSuccess = function(){
    return(this.getCurrentEvalResult());
};
exports.onFail = function(){
    return(!this.getCurrentEvalResult());
};
exports.done = function(data, done){
    done(data);
};
exports.getTimeout  =   function(){
    return(this.getCurrentTimeOut());
};
exports.onTimeout  =   function(data, done){
    var self            =   this;
    var current_step    =   self.getCurrentStep();
    self.getTransaction(function(err, trans){
        if(!err && trans){
            trans.updateState(11, current_step, function(){
                done(data);
            });
        }else{
            done(data);
        }
    });
};
