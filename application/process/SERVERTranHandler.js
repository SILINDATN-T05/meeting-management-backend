

var async               =   require('async');
var S                   =   require('string');
var moment              =   require('moment');

var TranFlowStep        =   require('../../model/TransactionFlowStep-model');
var TransHandler        =   require('../../model/TranHandler-model');
var TranTemp            =   require('../../model/TranTemplate-model');
var Session             =   require('../../model/Session-model');
var ResponseBuilder     =   require('./TransactionStepResultBuilder');
var HandlerLocator      =   require('../context/tran_handler/HandlerLocator');
var ParserLocator       =   require('../context/response_parser/ParserLocator');
var PayloadBuilder      =   require('../context/tran_handler/PayloadBuilder');
var StepLogger          =   require('./TranStepLogger');
var expressionParser    =   require('../../engine/ExpressionParser');
var handlerLocator      =    new HandlerLocator();
var parserLocator       =    new ParserLocator();
var payloadBuilder      =    new PayloadBuilder();
var stepLogger          =    new StepLogger();
var responseBuilder     =    new ResponseBuilder();

function SERVERTranHandler(){

}
SERVERTranHandler.prototype.handleStep    =   function(tran_step, process, conditions, step_config, callback){
    var step_name       =   process.getCurrentStep();
    var server_ref     =   process.getServerRef();
    var process_options =   process.getOptions();
    var flow            =   process.getFlow();
    var flow_extras     =   process.getFlowExtras();
    var session_id      =   process.getSession();
    async.waterfall([
        function doStep(next){
            TranFlowStep.findOne({_id: tran_step}, function(err, step){
                if(!err && step){
                    next(null, step);
                }else{
                    next('#process.step.invalid');
                }
            });
        },
        function doHandler(step, next){
            TransHandler.findOne({_id:step.handler}, function(err, handler){
                if(!err && handler){
                    next(null, handler);
                }else{
                    next('#process.handler.invalid');
                }
            });
        },
        function doTemplate(handler, next){
            TranTemp.findOne({_id: handler.template}, function(err, template){
                if(!err && template){
                    next(null,  handler, template);
                }else{
                    next('#process.template.invalid');
                }
            });
        },
        function locateSession(handler, template, next){
            Session.findOne({_id:session_id}, function (err, session) {
               if(!err && session){
                    next(null, session, handler, template);
               }else{
                   next(null, {}, handler, template);
               }
            });
        },
        function locateExtras(session, handler, template, next){
            process.getExtras(function(err, extras){
                var params  =   {   extras:     extras||{},
                                    trans:      {server_ref:server_ref},
                                    options:    process_options,
                                    session:    session
                               };
                next(null, handler, template, params);
            });
        },
        function doPayloadExpressions(handler, template, params, next){
            try{
                next(null, handler, template, params, expressionParser.template(template.messageTemplate));
            }catch(e){
                next('#expression_parser.failed');
            }
        },
        function doPayload(handler, template, params, payload, next){
            payloadBuilder.buildPayload(payload, params, function(err, payload){
                if(!err && payload){
                    next(null, handler, template, params, payload);
                }else{
                    next(new Error(err));
                }
            });
        },
        function doLog(handler, template, params, payload, next){
            var options          =   params.options;
            var step_number      =   process.nextStepNumber();
            stepLogger.createStepLog(server_ref, step_name, step_number, payload, options,handler, function(err){
                next(null, handler, template, params, payload);
            });
        },
        function doUri(handler, template, params, payload, next){
            payloadBuilder.buildTemplate(server_ref, template.endPoint||'/', function(err, uri){
                next(null, handler, template, params, payload, uri);
            });
        },
        function doHeaders(handler, template, params, payload, uri, next){
            payloadBuilder.buildTemplate(server_ref, template.headers, function(err, headers){
                if(!err && uri){
                    next(null, handler, template, payload, uri, headers, params);
                }else{
                    next(err);
                }
            });
        },
        function doTemplateOptions(handler, template, payload, uri, headers, params, next){
            async.forEachOf(process.getTemplateOptions(), function mapExtras(param, name, sb){
                payloadBuilder.buildPayload(param, params, function(err, payload){
                    if(!err && payload){
                        process_options[name]  =   payload;
                    }else{
                        process_options[name]  =   param;
                    }
                    sb();
                });
            }, function close(){
                process.setOptions(process_options);
                params['options']   =   process_options;
                process_options     =   process_options;
                next(null, handler, template, payload, uri, headers, params);
            });
        },
        function doHandle(tran_handler, template, payload, uri, headers, params, next){
            var parser      =   parserLocator.locateParser(tran_handler.parserPath);
            var handler     =   handlerLocator.locateHandler(tran_handler.handlerPath);
            var mapper      =   template.responseMapper||{};
            handler.processStep(uri, headers, template.action, payload, function(err, result){
                if(!err && result){
                    next(null, mapper, result, parser, params);
                }else{
                    next(null, mapper, {code:'06', message:err}, parser, params);
                }
            });
        },
        function doResponse(mapper, result, parser, params, next){
            mapper  =   mapper||{};
            if(parser && typeof parser['parseResult'] === 'function') {
                responseBuilder.buildResponse(mapper, result, parser, function(err, response){
                    next(null, response, result, params);
                });
            }else{
                var params      =   arguments.callee.caller.arguments;
                var args        =   Array.prototype.slice.call(params, 0);
                var callback    =   args.pop();
                callback('#step_handler.parser.invalid');
            }
        },
        function evaluateResult(response, result, params, next){
            response = response||{};
            var extras      =       params.extras||{};
            var expression  =       'var data        =' +JSON.stringify(response) +';'+
                                    'var trans_type  =' +JSON.stringify(params.trans_type) +';'+
                                    'var trans       =' +JSON.stringify(params.trans) +';'+
                                    'var options     =' +JSON.stringify(process.getOptions()) +';'+
                                    'var config      =' +JSON.stringify(params.config) +';'+
                                    'var extras      =' +JSON.stringify(extras) +';'+
                                    'var result      =   {code:"00", message:"success",data: data};' +
                                    conditions+';  return(result);';
            var evalResult  =   Function(expression)();
            next(null, params, evalResult, result);
        },
        function doFlowExtras(params, response, result, next){
            async.waterfall([
                function doParams(fx){
                    var data    =   response.data || {};
                    var extras  =   {};
                    async.forEachOf(flow_extras, function mapExtras(param, name, sb){
                        if(data[param] &&  data[param] != undefined){
                            extras[name]   =   data[param];
                        }
                        sb();
                    }, function close(){
                        process.updateOptions(extras);
                        fx();
                    });
                }
            ],
            function move(){
                params['options']   =   process.getOptions();
                next(null, params, response, result);
            });
        },

        //--------------------- end trans params----------------//
        function doClose(params, response, result, next){
            stepLogger.updateStepLog(server_ref, step_name, result, response, function(err){
                if(err){
                    console.log('SERVERTranHandler doClose-err:',err);
                }
                return next(null, response);
            });
        }
    ], function done(err, result){

        if(!err && result){
            callback(result);
        }else{
            var response = { code:'06', message:err};
            stepLogger.updateStepLog(server_ref, step_name, result, response, function(e){
                callback({code:'06', message:err});
            });
        }
    });
};
module.exports  =  new SERVERTranHandler();
