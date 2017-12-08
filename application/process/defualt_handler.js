
/*
    THESE HANDLERS ARE NOT USED THAT MUCH
    DO NOT MAKE CHANGES HERE :)
 */

var locator                 =   require('./FlowStepLocator');
var async                   =   require('async');
var statusParser            =   require('./TranStatusParser');

exports.defaultEventHandler = function(eventType, currentFlowObjectName, handlerName, reason, done) {
    done();
};
exports.defaultErrorHandler = function(error, done) {
    done();
};
exports.onBeginHandler = function(current_step, data, done) {
    var self    =   this;
    self.switchNext(current_step);
    done(data);
};
exports.onEndHandler = function(current_step, data, next) {
    var self                =   this;
    async.waterfall([
        function updateTransaction(fn){
            self.getTransaction(function(err, trans){
                if(!err && trans){
                    self.getCurrentLog(function(err, log){
                        if(!err && log){
                            trans.updateState(log.response_code, current_step, function(){
                                fn();
                            });
                        }else{
                            fn();
                        }
                    });
                }else{
                    fn();
                }
            });
        },
        function isBoundary(fn){
            fn(self.isEnd()?null:self.getCurrentStep());
        },
        function sendResult(fn){
            self.sendResponse(function(){
                fn();
            });
        }
    ],
        function done(){
            next(data);
        });
};

