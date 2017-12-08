
var HandlerLocator = require('../context/tran_handler/HandlerLocator');
var ParserLocator = require('../context/response_parser/ParserLocator');
var PayloadBuilder = require('../context/tran_handler/PayloadBuilder');
var StepLogger = require('./TranStepLogger');
var expressionParser = require('../../engine/ExpressionParser');
var handlerLocator = new HandlerLocator();
var parserLocator = new ParserLocator();
var payloadBuilder = new PayloadBuilder();
var stepLogger = new StepLogger();
var TranFlowStep = require('../../model/TransactionFlowStep-model');
var TransHandler = require('../../model/TranHandler-model');
var TranTemp = require('../../model/TranTemplate-model');
var Transaction = require('../../model/Transaction-model');
var TranType = require('../../model/TransactionType-model');
var User = require('../../model/User-model');
var Config = require('../../model/Configuration-model');
var _ = require('underscore');
var ResponseBuilder = require('./TransactionStepResultBuilder');
var responseBuilder = new ResponseBuilder();
var async = require('async');
var S = require('string');
var moment = require('moment');

function TranHandler() {

}
var locateParams = function (process, step_config, callaback) {

    var server_ref = process.getProperty('server_ref');
    var trans_typ = process.getProperty('trans_type');
    var user_id = process.getProperty('user');


    async.parallel({
        user: function (next) {
          User.findOne({_id: user_id}, function (err, doc) {
            if (!err && doc) {
              next(null, doc);
            } else {
              next('#process.user.invalid');
            }
          });
        },
        trans_type: function (next) {
            TranType.findOne({_id: trans_typ}, function (err, doc) {
                if (!err && doc) {
                    next(null, doc);
                } else {
                    next('#process.transactiontype.invalid');
                }
            });
        },
        trans: function (next) {
            Transaction.findOne({server_ref: server_ref}, function (err, trans) {
                if (!err && trans) {
                    next(null, trans);
                } else {
                    next('#process.transaction.invalid');
                }
            });
        },
        config: function (next) {
            Config.findOne({_id: step_config}, function (err, doc) {
                var data = doc && doc.value ? doc.value : {};
                next(null, data);
            });
        }
    }, function done(err, result) {
        return callaback(err, result.trans_type, result.trans, result.config, result.user);
    });
};
var searchArray = function (data, query) {
    var result = _.findWhere(data, query);
    return (result);
};
TranHandler.prototype.handleStep = function (tran_step, process, conditions, step_config, callback) {
    var step_name = process.getCurrentStep();
    var server_ref = process.getServerRef();
    var process_options = process.getOptions();
    var flow = process.getFlow();
    var flow_extras = process.getFlowExtras();
    var trans_params = process.getTransParams();
    var session_id = process.getSession();
    async.waterfall([
        function doStep(next) {
            TranFlowStep.findOne({_id: tran_step}, function (err, step) {
                if (!err && step) {
                    next(null, step);
                } else {
                    next(new Error('#process.step.invalid'));
                }
            });
        },
        function doHandler(step, next) {
            TransHandler.findOne({_id: step.handler}, function (err, handler) {
                if (!err && handler) {
                    next(null, handler);
                } else {
                    next(new Error('#process.handler.invalid'));
                }
            });
        },
        function doTemplate(handler, next) {
            TranTemp.findOne({_id: handler.template}, function (err, template) {
                if (!err && template) {
                    next(null, handler, template);
                } else {
                    next(new Error('#process.template.invalid'));
                }
            });
        },
        function locateExtras(handler, template, next) {
            process.getExtras(function (err, extras) {
                next(null, extras || {}, handler, template);
            });
        },
        function doParams(extras, handler, template, next) {
            locateParams(process, step_config, function (err, trans_type, trans, step_config, user) {
                if (!err) {
                    var params = {
                        trans_type: trans_type,
                        trans: trans,
                        options: process_options,
                        config: step_config,
                        extras: extras,
                        session: session_id,
                        user:user
                    };
                    next(null, handler, template, params);
                } else {
                    next(new Error(err));
                }
            });
        },
        //------------ template expressions------------//
        function doPayloadExpressions(handler, template, params, next) {
            try {
                next(null, handler, template, params, expressionParser.template(template.messageTemplate));
            } catch (e) {
                next('#expression_parser.failed');
            }
        },
        //================end expressions---------------//
        function doPayload(handler, template, params, payload, next) {
            payloadBuilder.buildPayload(payload, params, function (err, payload) {
                if (!err && payload) {
                    next(null, handler, template, params, payload);
                } else {
                    next(new Error(err));
                }
            });
        },
        function doLog(handler, template, params, payload, next) {
            var options = params.options;
            var step_number = process.nextStepNumber();
            stepLogger.createStepLog(server_ref, step_name, step_number, payload, options, handler, function (err) {
                next(null, handler, template, params, payload);
            });
        },
        function doUri(handler, template, params, payload, next) {
            payloadBuilder.buildPayload(template.endPoint || '/', params, function (err, uri) {
                if (!err && payload) {
                    next(null, handler, template, params, payload, uri);
                } else {
                    next(new Error(err));
                }
            });
        },
        function doHeaders(handler, template, params, payload, uri, next) {
            payloadBuilder.buildPayload(template.headers, params, function (err, headers) {
                if (!err && payload) {
                    next(null, handler, template, params, payload, uri, headers);
                } else {
                    next(new Error(err));
                }
            });

        },
        function doAction(handler, template, params, payload, uri, headers, next) {
            payloadBuilder.buildPayload(template.action, params, function (err, action) {
                if (!err && payload) {
                    next(null, handler, template, payload, uri, headers, params, action);
                } else {
                    next(new Error(err));
                }
            });

        },
        function doTemplateOptions(handler, template, payload, uri, headers, params, action, next) {
            async.forEachOf(process.getTemplateOptions(), function mapExtras(param, name, sb) {
                payloadBuilder.buildPayload(param, params, function (err, payload) {
                    if (!err && payload) {
                        process_options[name] = payload;
                    } else {
                        process_options[name] = param;
                    }
                    sb();
                });
            }, function close() {
                process.setOptions(process_options);
                params['options'] = process_options;
                process_options = process_options;
                //console.error(next, params);
                next(null, handler, template, payload, uri, headers, params, action);
            });
        },
        function doHandle(tran_handler, template, payload, uri, headers, params, action, next) {
            var parser = parserLocator.locateParser(tran_handler.parserPath);
            var handler = handlerLocator.locateHandler(tran_handler.handlerPath);
            var mapper = template.responseMapper || {};
            handler.processStep(uri, headers, action, payload, function (err, result) {
                if (!err && result) {
                    next(null, mapper, result, parser, params);
                } else {
                    next(null, mapper, {code: '06', message: err}, parser, params);
                }
            });
        },
        function doResponse(mapper, result, parser, params, next) {
            mapper = mapper || {};
            if (parser && typeof parser['parseResult'] === 'function') {
                responseBuilder.buildResponse(mapper, result, parser, function (err, response) {
                    next(null, response, result, params);
                });
            } else {
                var params = arguments.callee.caller.arguments;
                var args = Array.prototype.slice.call(params, 0);
                var callback = args.pop();
                callback('#step_handler.parser.invalid');
            }
        },
        function evaluateResult(response, result, params, next) {
            response = response || {};
            var extras = params.extras || {};
            var expression = 'var data =' + JSON.stringify(response) + ';' +
                'var trans_type =' + JSON.stringify(params.trans_type) + ';' +
                'var user =' + JSON.stringify(params.user) + ';' +
                'var trans =' + JSON.stringify(params.trans) + ';' +
                'var options =' + JSON.stringify(process.getOptions()) + ';' +
                'var config =' + JSON.stringify(params.config) + ';' +
                'var extras =' + JSON.stringify(extras) + ';' +
                'var result = {code: "00", message: "success", data: data};' +
                conditions + ';  return(result);';

            var evalResult = Function(expression)();

            next(null, params, evalResult, result);

        },
        function doFlowExtras(params, response, result, next) {
            async.waterfall([
                    function doParams(fx) {
                        var data = response.data || {};
                        var extras = {};
                        async.forEachOf(flow_extras, function mapExtras(param, name, sb) {
                            if (data[param] && data[param] != undefined) {
                                extras[name] = data[param];
                            }
                            sb();
                        }, function close() {
                            process.updateOptions(extras);
                            fx();
                        });
                    }
                ],
                function move() {
                    params['options'] = process.getOptions();
                    next(null, params, response, result);
                });
        },
        //----------------------- update params-----------------//
        function doTransParams(params, response, result, next) {
            var trans = params['trans'];
            async.waterfall([
                    function doParams(fx) {
                        var data = process.getOptions();
                        async.forEachOf(trans_params, function mapExtras(param, name, sb) {
                            if (data[param] && data[param] != undefined) {
                                trans[name] = data[param];
                            }
                            sb();
                        }, function close() {
                            fx();
                        });
                    }
                ],
                function move() {
                    trans.save(function (err, doc) {
                        params['trans'] = doc;
                        next(err, params, response, result);
                    });
                });
        },
        //--------------------- end trans params----------------//
        function doClose(params, response, result, next) {
            stepLogger.updateStepLog(server_ref, step_name, result, response, function (err) {
                console.log(err);
                return next(null, response);
            });
        },
    ], function done(err, result) {
        if (!err && result) {
            callback(result);
        } else {
            var response = {code: '06', message: err};
            stepLogger.updateStepLog(server_ref, step_name, result, response, function (e) {
                callback({code: '06', message: err});
            });
        }
    });
};
module.exports = new TranHandler();
