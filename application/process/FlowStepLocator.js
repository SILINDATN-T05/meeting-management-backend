
var Flow = require('../../model/TransactionFlow-model');
var async = require('async');

function Locator() {

}
Locator.prototype.locateFlowStep = function (flow, name, callback) {
    async.waterfall([
            function doFlow(next) {
                Flow.findOne({_id: flow}, function (err, flow) {
                    next(err, flow.steps);
                });
            },
            function doSteps(steps, next) {
                var step = null;
                var condition = {};
                async.forEachOf(steps, function (current, i, fn) {
                    step = (!step && current.name === name) ? current : step;
                    fn();
                }, function _done() {
                    condition = (step) ?
                        step.transition ?
                            step.transition.condition
                            : condition :
                        condition;
                    next(step ? null : '#transaction.flow.step.locate.invalid', step, condition);
                });
            }
        ],
        function done(err, step, condition) {
            callback(err, step, condition);
        });
};
Locator.prototype.isBoundary = function (flow, name, callback) {
    var self = this;
    self.locateFlowStep(flow, name, function (err, step) {
        if (!err && step) {
            return callback(step &&
                step.transition.onFail === step.transition.onSuccess &&
                step.transition.onSuccess === 'END');
        } else {
            callback(false);
        }
    });
};
Locator.prototype.isAutoComplete = function (flow, name, callback) {
    var self = this;
    self.locateFlowStep(flow, name, function (err, step) {
        if (!err && step) {
            return callback(step &&
                step.autocomplete === 'YES');
        } else {
            callback(false);
        }
    });
};
module.exports = new Locator();
