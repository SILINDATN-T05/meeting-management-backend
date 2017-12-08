
var format              =   require('util').format;
var task                =   require('./handler');
var df                  =   require('./defualt_handler');
var FlowParser          =   require('./FlowParser');
var flowParser          =   new FlowParser();
var start               =   '<bpmn:startEvent name="%s" label="%s" id="%s"></bpmn:startEvent>';
var serviceTask         =   '<bpmn:task name="%s" label="%s" id="%s"></bpmn:task>';
var transition          =   '<bpmn:sequenceFlow sourceRef="%s" targetRef="%s" id="%s" label="%s"></bpmn:sequenceFlow>';
                            //source, target, id, labale, name
var gatewayTransition   =   '<bpmn:sequenceFlow sourceRef="%s" targetRef="%s" id="%s" label="%s" name="%s"></bpmn:sequenceFlow>';
var end                 =   '<bpmn:endEvent name="%s" label="%s" id="100"></bpmn:endEvent>';
var footer              =   '</bpmn:process></bpmn:definitions>';
var serviceGateway      =   '<bpmn:exclusiveGateway name="%s" label="%s?" id="%s"></bpmn:exclusiveGateway>';
var timeOut             =   '<bpmn:boundaryEvent name="%s_Timeout" attachedToRef="%s" label="%s_Timeout" id="%s">'+
                            '<bpmn:timerEventDefinition/>'+
                            '</bpmn:boundaryEvent>';
//name, parent_id, name, id
var S                   =   require('string');

function Builder(){

}
var header  =   function(name){
    return('<bpmn:definitions ' +
            'xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" ' +
            'xmlns:debugger="http://e2e.ch/bpmneditor/debugger">'+
            format('<bpmn:process id="%s">', name));
};
var endEvent     =   function(name){
    return(format(end, name, name));
};
var startEvent  =   function(name, id){
    name    =   'START';
    return(format(start, name, name, id));
};
//-----------------------------------------//
var isExclusive =   function(transition){
    var result  =   S(transition.onFail).s === S(transition.onSuccess).s;
    return(!result);
};
Builder.prototype.buildSteps  =   function(flow, callback){
    if(flow===null || flow.steps===undefined){
        return callback('#flow.builder.invalid');
    }
    var steps       =   flow.steps;
    var result      =   '';
    var handler     =   require('./process_handler');
    var timeMapper  =   {};
    for(z = 0; z < steps.length; z++) {
        var current                     =   steps[z];
        var current_name                =   current.name;
        if(isExclusive(current.transition)){
            if(!handler[current_name]){
               //var current                     =   steps[z];
                handler[current_name+'_']       =   task.gateway;//not too sure which one runs
                handler[current_name]           =   task.gateway;//not too sure which one runs
                handler[current_name+'Done']    =   task.done;
                handler[current_name+'$ok']     =   task.onSuccess;
                handler[current_name+'$nok']    =   task.onFail;
                result                          +=  format(serviceGateway, current_name, current_name, current.id);
            }
        }else{
            if(!handler[current_name]){
                handler[current_name]           =    task.task;
                result                          +=   format(serviceTask, current_name, current_name, current.id);
            }
        }
        //-------------- AD TIMEOUT--------//
        //console.error('_________STEP__', current_name, current.time_out);
        if(current && current.time_out && current.time_out > 0){
            var t_name  =   current_name+'_Timeout';
            var o_name  =   'Task';
            handler[t_name+'$getTimeout']       =   task.getTimeout;//not too sure which one runs
            handler[o_name+'$getTimeout']       =   task.getTimeout;
            handler[t_name]                     =   task.onTimeout;//not too sure which one runs
            handler[o_name]                     =   task.onTimeout;//not too sure which one runs
            timeMapper[current_name+'_TIMEOUT'] =   current.time_out;
        }
    }
    for(var i in  df){
        handler[i] = df[i];
    }
    callback(null, result, handler, timeMapper);
};
Builder.prototype.locateTarget  =   function(target, steps){
    for(k = 0; k < steps.length; k++) {
        var current = steps[k];
        if(current.name === target){
            return(current);
        }
    }
    return(null);
};
Builder.prototype.locateParent  =   function(target, steps){
    for(k = 0; k < steps.length; k++) {
        var current = steps[k];
        if(current.transition.onSuccess === target){
            return(current);
        }
    }
    return(null);
};
Builder.prototype.buildTransitions  =   function(flow, callback){
    var steps   =   flow.steps;
    var result  =   '';
    var self    =   this;
    var start   =   self.locateTarget(flow.startStep, steps);
    if(start === null){
        return callback('#process.flow.start_event.invalid');
    }
    result          +=   format(transition, flow._id, start._id, '101', 'START');
    var endCount        =   13;
    var otherCount      =   150;
    var timeOutsCount   =   300;
    for(i = 0; i < steps.length; i++) {
        var current  =   steps[i];
        var tran     =   current.transition;
        //------------------start.json ------------------//
        if(!isExclusive(current.transition)) {
            var target  =  self.locateTarget(tran.onFail, steps);
            if(tran.onFail === 'END'){
                result      +=   format(gatewayTransition, current._id, '100', (tran.id)?tran.id:endCount++, 'Finish', 'Finish');
            }else{
                result      += format(gatewayTransition, current._id, target._id, tran.id, current.name/*tran.name*/, 'Task');
            }
        }else{
            var failed  = self.locateTarget(tran.onFail, steps);
            var success = self.locateTarget(tran.onSuccess, steps);
            if(tran.onFail === 'END'){
                result      +=   format(gatewayTransition, current._id, '100', ++otherCount /*tran.id*/, '', 'nok');
            }else{
                result += format(gatewayTransition, current._id, failed._id, ++otherCount/*tran.id+'_nok'*/, current.name/*tran.name*/, 'nok');
            }
            if(tran.onSuccess === 'END'){
                result      +=   format(gatewayTransition, current._id, '100', ++otherCount/*tran.id*/, '', 'ok');
            }else{
                result += format(gatewayTransition, current._id, success._id, ++otherCount/*tran.id+'_ok'*/, current.name/*tran.name*/, 'ok');
            }
        }
        //------------------------------ TIME OUT-------------//
        if(current && current.time_out && current.time_out > 0){
            result += format(timeOut, current.name/*tran.name*/, current._id, current.name/*tran.name*/, ++timeOutsCount);
            result +=   format(gatewayTransition, timeOutsCount/*current._id*/, '100', ++timeOutsCount, '', '');
        }
    }
    return callback(null, result);
};
Builder.prototype.buildTransactionFlow = function(tran_type, flow, callback){
    var self    =   this;
    var xml     =   header(tran_type.pross_name);
    xml         +=  startEvent(flow.startStep, flow._id);
    self.buildSteps(flow, function(err, steps, handler, timeMapper){
        if(!err){
            xml +=  steps;
            xml +=  endEvent('END');
            self.buildTransitions(flow, function(err, transitions){
                if(!err){
                    xml     +=  transitions;
                    xml     +=  footer;
                    callback(null, xml, handler, timeMapper);
                }else{
                    return callback(err);
                }
            });
        }else{
            return callback(err);
        }
    });
};
module.exports  =   Builder;
