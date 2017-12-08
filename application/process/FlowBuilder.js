
var async = require('async');
var XML = require('./helper/xml-helper');
var task = require('./handler');
var df = require('./defualt_handler');
var S = require('string');
var StringBuilder = require('string-builder');
var uuid = require('uuid');
var ids = {};
var bf = new StringBuilder();

function FlowBuilder() {

}
FlowBuilder.prototype.buildProcess = function (trans_type, flow, callback) {

    var self = this;
    var xml = new XML();
    self.ids = {
        start: self.generateId(),
        end: self.generateId()
    };
    bf.clear();
    async.waterfall([
            function doNormalise(next) {
                var steps = [];
                async.forEachOf(flow.steps, function fx(step, index, cb) {
                    steps.push({
                        name: step.name,
                        id: self.generateId(),
                        time_out: step.time_out,
                        timeout_target: step.timeout_target,
                        isExclusive: self.type(step),
                        transition: {
                            id: self.generateId(),
                            name: step.transition.name,
                            onFail: step.transition.onFail,
                            onSuccess: step.transition.onSuccess
                        }
                    });
                    cb();
                }, function doMove() {
                    next(null, steps);
                });
            },
            function doServiceTask(steps, next) {
                bf.append(xml.header(trans_type.pross_name));
                bf.append(xml.start(self.ids.start));
                async.forEachOf(steps, function fx(step, index, cb) {
                    if (step.isExclusive && step.isExclusive === true) {
                        bf.append(xml.tag('exclusiveGateway', step.id, step.name + '?'));
                    } else {
                        bf.append(xml.tag('task', step.id, step.name));
                    }
                    cb();
                }, function doMove() {
                    next(null, steps);
                });
            },
            function doTransitions(steps, next) {
                var handlers = require('./process_handler');
                var start = self.locateTarget(steps, flow.startStep);
                if (start===null) {
                    console.log("Flow Error : step name: ",flow.startStep);
                    error = '#invalid.step.name.inflow';
                    next(error, null);
                }
                else {
                    bf.append(xml.linkedTag(self.ids.start, start.id, self.generateId(), 'sequenceFlow', start.name));
                    var error = null;
                    async.forEachOf(steps, function fx(step, index, cb) {
                        var successTarget = self.locateTarget(steps, step.transition.onSuccess);
                        if (step.isExclusive && successTarget) {
                            var failedTarget = self.locateTarget(steps, step.transition.onFail);
                            if (failedTarget) {
                                bf.append(xml.linkedTag(step.id, successTarget.id, self.generateId(), 'sequenceFlow', 'SUCCESS'));
                                bf.append(xml.linkedTag(step.id, failedTarget.id, self.generateId(), 'sequenceFlow', 'FAILED'));
                                handlers[step.name + '_'] = task.gateway;
                                handlers[step.name + '_$SUCCESS'] = task.onSuccess;
                                handlers[step.name + '_$FAILED'] = task.onFail;
                            } else {
                                error = '#invalid.step.target.failed';
                            }

                        } else if (successTarget) {
                            bf.append(xml.linkedTag(step.id, successTarget.id, self.generateId(), 'sequenceFlow', step.name));
                            handlers[step.name] = task.task;
                            handlers[step.name + 'Done'] = task.done;
                        } else {
                            error = '#invalid.step.target.success';
                        }
                        if (step.time_out > 0) {
                            var id = self.generateId();
                            var timeOutTarget = self.locateTarget(steps, step.timeout_target);
                            if (timeOutTarget) {
                                bf.append(xml.timeOut(id, step.name, step.id));
                                bf.append(xml.linkedTag(id, timeOutTarget.id, self.generateId(), 'sequenceFlow', timeOutTarget.name));
                                handlers[step.name + '_Timeout'] = task.onTimeout;
                                handlers[step.name + '_Timeout$getTimeout'] = task.getTimeout;
                            } else {
                                error = '#invalid.step.target.timeout';
                            }
                        }


                        cb();
                    }, function doMove() {
                        bf.append(xml.end(self.ids.end));
                        bf.append(xml.footer());
                        next(error, handlers);
                    });
                }
            },
            function addDefaults(handlers, next) {
                for (var i in  df) {
                    handlers[i] = df[i];
                }
                next(null, handlers);
            }
        ],
        function done(err, handlers) {
            callback(err, bf.toString(), handlers);
        });
};
FlowBuilder.prototype.locateTarget = function (steps, target) {
    if (target === 'END') {
        return ({
            name: 'END',
            id: this.ids.end
        });
    } else {
        for (k = 0; k < steps.length; k++) {
            var current = steps[k];
            if (S(current.name).collapseWhitespace().s === S(target).collapseWhitespace().s) {
                return (current);
            }
        }
        //----------- DEFAULT TO END STEP
        //console.error('LOCATE STEP FAILED:', +'|'+target+'|', 'DEFAULTING TO END');
        //return({
        //name:'END',
        //id: this.ids.end
        //});
        return null;
    }
};
FlowBuilder.prototype.generateId = function () {
    return (uuid.v4());
};
FlowBuilder.prototype.type = function (step) {
    return (!(S(step.transition.onFail).s === S(step.transition.onSuccess).s));
};
FlowBuilder.prototype.buildTimers = function (flow, callback) {
    var timers = {};
    async.forEachOf(flow.steps, function fx(step, index, cb) {
        if (step && step.time_out && step.time_out > 10) {
            timers[step.name] = step.time_out;
        }
        cb();
    }, function done() {
        callback(null, timers);
    });
};
module.exports = new FlowBuilder();
