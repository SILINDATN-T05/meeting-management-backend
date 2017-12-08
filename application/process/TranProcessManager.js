
var async                   =   require('async');
var S                       =   require('string');
var bpmn                    =   require('bpmn');
var merge                   =   require('merge-util');
var Logger                  =   require('./../../model/TranStepLog-model');
var Transaction             =   require('../../model/SERVERTransaction-model');
var SERVERTransaction          =   require('../../model/SERVERTransaction-model');
var ResponseBuilder         =   require('./TransactionStepResultBuilder');
var processBuffer           =   require('./ProcessBuffer');
var valueReplace            =   require('value-replace');
var responseBuilder         =   new ResponseBuilder();
var manager                 =   null;
var process_list            =   [];


function TranProcessManager(options){
    if(options){
        var protocol    =   'mongodb://';
        var uri         =   S(options.url).chompLeft(protocol).s;

        if (options.server.ssl) {
          uri             =   protocol.concat(options.user, ':', options.pass, '@', uri);
          uri             =   uri.concat('?authSource=', options.auth.authdb);
        } else {
          uri             =   protocol.concat(uri);
        }

        options['uri']  =   uri;
        manager         =   bpmn;
        processBuffer.init(manager, function () {
        });
    }
}
TranProcessManager.prototype.createProcess  =   function(process_name, callback){
    var self    =   this;
    processBuffer.nextProcess(process_name, function (err, transaction, process) {
        if(!err && transaction && process){
            self._bindMethods(process, function(err, process){
                callback(err, process, transaction);
            });
        }else{
            callback(err);
        }
    });
};
TranProcessManager.prototype._bindMethods   =   function(pros, callback){
    async.waterfall([
        function _trans(next) {
            pros.setServerRef = function (server_ref) {
                this.setProperty('server_ref', server_ref);
            };
            pros.getServerRef = function () {
                return(this.getProperty('server_ref'));
            };
            pros.setStepNumber = function (step_number) {
                this.setProperty('step_number', step_number);
            };
            pros.getStepNumber = function () {
                return(this.getProperty('step_number')||1);
            };
            pros.setTransType = function (trans_type) {
                this.setProperty('trans_type', trans_type);
            };
            pros.getTransType = function () {
                return(this.getProperty('trans_type'));
            };
            pros.setTransCode = function (tran_code) {
                this.setProperty('tran_code', tran_code);
            };
            pros.getTransCode = function () {
                return(this.getProperty('tran_code'));
            };
            pros.setOptions = function (process_options) {
                this.setProperty('process_options', process_options);
            };
            pros.getOptions = function () {
                return(this.getProperty('process_options')||{});
            };
                //---------trans extra
            pros.setTransParams = function (transaction_params) {
                this.setProperty('transaction_params', transaction_params);
            };
            pros.getTransParams = function () {
                return(this.getProperty('transaction_params')||{});
            };


          //---------user
          pros.setUser = function (user) {
            this.setProperty('user', user);
          };
          pros.getUser = function () {
            return(this.getProperty('user')||'');
          };
                //--------------
            pros.setTemplateOptions = function (process_options) {
                this.setProperty('template_process_options', process_options);
            };
            pros.getTemplateOptions = function () {
                return(this.getProperty('template_process_options')||{});
            };
                //-------------
            pros.setFlow = function (tran_flow) {
                this.setProperty('tran_flow', tran_flow);
            };
            pros.getFlow = function () {
                return(this.getProperty('tran_flow'));
            };
            pros.setFlowExtras = function (tran_flow) {
                this.setProperty('tran_flow_extras', tran_flow);
            };
            pros.getFlowExtras = function () {
                return(this.getProperty('tran_flow_extras'));
            };
            pros.setSession = function (session_id) {
                this.setProperty('session_id', session_id);
            };
            pros.getSession = function () {
                return(this.getProperty('session_id'));
            };
            pros.setSERVER = function () {
                this.setProperty('server_type', true);
            };
            pros.isSERVER = function () {
                return(this.getProperty('server_type')||false);
            };
            pros.setTranMap = function (map) {
                this.setProperty('tran_map', map);
            };
            pros.getTranMap = function () {
                return(this.getProperty('tran_map')||false);
            };
            pros.getTransaction = function (fn) {
                var self        = this;
                var server_ref = self.getServerRef();
                var model       =  (self.isSERVER() && self.isSERVER() === true)? SERVERTransaction: Transaction;
                model.findOne({server_ref: server_ref}, function (err, tran) {
                    fn(err, tran);
                });
            };
            pros.getCurrentLog   =   function(fn){
                var self = this;
                var server_ref     = self.getServerRef();
                var current_step    = self.getCurrentStep();
                Logger.findOne({server_ref:server_ref, step_name:current_step}, function(err, log){
                    fn(err, log);
                });
            };
            pros.nextStepNumber   =   function() {
                var self              =   this;
                var current_number    =   self.getStepNumber();
                self.setStepNumber(current_number+1);
                return(current_number);
            };
            next();
        },
            //----------------- CALLBACK--------------//
        function _caller(next) {
            pros.setCaller = function (fx) {
                this.setProperty('process_done', fx);
            };
            pros.getCaller = function () {
                return(this.getProperty('process_done'));
            };
            pros.cleanCaller = function () {
                this.setProperty('process_done', null);
            };
            pros.sendResponse   =   function(fn){
                var self        =   this;
                var trans_type  =   self.getTransType();
                var server_ref =   self.getServerRef();
                var fx          =   self.getCaller();
                if(fx){
                    responseBuilder.buildTransactionResponse(trans_type, server_ref, function (err, result) {
                        fx(result);
                        if(fn){ fn(); }
                    });
                }else{
                    if(fn){ fn(); }
                }
            };
            next();
        },
        function _timers(next) {
            pros.setTimeOut = function (step_name, time) {
                this.setProperty(step_name + '_TIMEOUT', time);
            };
            pros.getTimeOut = function (step_name) {
                return(this.getProperty(step_name + '_TIMEOUT'));
            };
            pros.setGlobalTimeout = function (time) {
                this.setProperty('GLOBAL_TIMEOUT', time);
            };
            pros.getGlobalTimeout = function () {
                return(this.getProperty('GLOBAL_TIMEOUT'));
            };
            pros.getCurrentTimeOut = function () {
                return(this.getTimeOut(this.getCurrentStep())||0);
            };
            pros.addTimeOuts = function (timeMapper, finished) {
                var self = this;
                async.forEachOf(timeMapper, function fx(time, step_name, cb) {
                    self.setTimeOut(step_name, time);
                    cb();
                }, function done() {
                    if(finished) {
                        finished();
                    }
                });
            };
            next();
        },
        function _move(next){
            pros.getCurrentStep =   function(){
                return(S(this.getProperty('current_step')).replaceAll('?', '').s);
            };
            pros.setCurrentStep =   function(current_step){
                this.setProperty('current_step', current_step);
            };
            pros.setPreviousStep =   function(previous_step){
                this.setProperty('previous_step', previous_step);
            };
            pros.switchNext =   function(next_step){
                var self            =   this;
                self.setPreviousStep(self.getCurrentStep());
                self.setCurrentStep(next_step);

            };
            next();
        },
        function _base(next) {
            pros.doStart = function () {
                this.setProperty('process_completed', false);
                this.setProperty('END_MARKED', false);
                this.setStepNumber(1);
                this.triggerEvent('START');
            };
            pros.clean = function () {
                this.setProperty('process_completed', true);
                this.setProperty('END_MARKED', true);
            };
            pros.isComplete = function () {
                return(this.getProperty('process_completed') === true);
            };
            pros.isEnd = function () {
                return(this.getProperty('current_step').toString() === 'END');
            };
            pros.markDone = function () {
                this.taskDone(this.getCurrentStep());
            };
            next();
        },
        function _extras(next) {
            pros.getExtras = function (fn) {
                var self = this;
                self.getTransaction(function (err, trans) {
                    if(!err && trans && trans.extras) {
                        fn(null, trans.extras);
                    }else{
                        fn({});
                    }
                });
            };
            pros.updateExtras = function (other, fn) {
                var self = this;
                self.getExtras(function(err, c_extras){
                    if(!err){
                        var extras     =   merge(c_extras, other);
                        Transaction.update({server_ref: self.getServerRef() },
                                { $set: {
                                     amount: extras.amount||0,
                                     extras: extras
                                    }}, function(err){
                                    fn(err);
                                });
                    }else{
                        fn(err);
                    }
                });
            };
            pros.updateOptions = function (options) {
                var self = this;
                self.setOptions(merge(self.getOptions(), options));
            };
            pros.updateMap = function (options) {
                var self = this;
                var updatedExtras = {};

                var tempValue;
                async.forEachOfSeries(options,function(optionsValue,optionsKey,optionsCb)
                {
                    async.forEachOfSeries(self.getTranMap(),function(mapValue,mapKey,mapCb)
                    {

                        if(optionsKey == mapValue)
                        {
                            tempValue = optionsValue;
                        }
                        async.forEachOfSeries(self.getFlowExtras(),function(extrasValue,extrasKey,extrasCb)
                        {
                            if(extrasKey == mapKey)
                            {
                                extrasValue = tempValue
                                merge(updatedExtras, valueReplace(self.getFlowExtras(),extrasKey,extrasValue))
                            }
                            extrasCb();
                        },function()
                        {
                            mapCb();
                        })
                    },function()
                    {
                        optionsCb();
                    })
                },function()
                {
                    self.setFlowExtras(updatedExtras);
                    self.updateExtras(updatedExtras,function(err)
                    {

                    })
                    //console.log(self.getFlowExtras())
                })
            };
            next();
        },
        function _gateways(next){
            pros.getCurrentEvalResult   =   function(){
                var self=   this;
                return(self.getEvalResult(self.getCurrentStep()));
            };
            pros.setCurrentEvalResult   =   function(eval_results){
                var self=   this;
                self.setEvalResult(self.getCurrentStep(), eval_results);
            };
            pros.getEvalResult   =   function(step_name){
                return(this.getProperty(step_name+'_EVAL_RESULT'));
            };
            pros.setEvalResult   =   function(current_step, eval_results){
                this.setProperty(current_step+'_EVAL_RESULT', eval_results);
            };
            next();
        }
    ],
        function done() {
            callback(null, pros);
        });
};
TranProcessManager.prototype.addBPMN   =   function(process_name, xml, handlers, callback){
    var self    =   this;
    try{
        if(!this.processDefinitionExist()){
            manager.addHandler(process_name, handlers);
            manager.addBpmnXML(xml, process_name);
            process_list.push(process_name);
            callback();
        }else{
            callback('#process.locate.exist');
        }
    }catch(e){
        callback(e);
    }
};
TranProcessManager.prototype.processDefinitionExist =   function(process_name){
    return(process_list.indexOf(process_name) > -1);
};
TranProcessManager.prototype.locateProcess        =   function(server_ref, callback){
    var self    =   this;
    manager.get(server_ref, function(err, process){
        if(!err && process) {
            self._bindMethods(process, function(err, process){
                callback(err, process);
            });
        }else{
            return callback('#process.locate.failed');
        }
    });
};
module.exports  =  TranProcessManager;
