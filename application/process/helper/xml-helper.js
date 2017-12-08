
var S   =   require('string');
function xml(){

}
xml.prototype.inner =   function(id, name, label){
    var data    =   {name:name, label:label||name, id:id};
    var inner   =   ' name=\'#{name}\' label=\'#{label}\' id=\'#{id}\' ';
    return(S(inner).template(data, '#{', '}').s);
};
xml.prototype.linkedInner =   function(source, target, id, name, label){
    var data    =   {name:name, label:label||name, id:id, target:target, source:source};
    var inner   =   ' name=\'#{name}\' label=\'#{label}\' id=\'#{id}\' sourceRef=\'#{source}\' targetRef=\'#{target}\' ';
    return(S(inner).template(data, '#{', '}').s);
};
xml.prototype.type =   function(type){
    var data    =   {type:type, part:'#{part}'};
    var xml     =   '<bpmn:#{type} #{part}></bpmn:#{type}>';
    return(S(xml).template(data, '#{', '}').s);
};
xml.prototype.start        =   function(id){
    var self    =   this;
    return(self.tag('startEvent', id, 'START'));
};
xml.prototype.end  =   function(id){
    var self    =   this;
    return(self.tag('endEvent', id, 'END'));
};
xml.prototype.tag =   function(type, id, name, label){
    var self    =   this;
    var start   =   self.type(type);
    var inner   =   {part: self.inner(id, name, label)};
    return(S(start).template(inner, '#{', '}').s);
};
xml.prototype.linkedTag =   function(source, target, id, type, name, label){
    var self    =   this;
    var start   =   self.type(type);
    var inner   =   {part: self.linkedInner(source, target, id, name, label)};
    return(S(start).template(inner, '#{', '}').s);
};
xml.prototype.footer   =   function(){
    return('</bpmn:process></bpmn:definitions>');
};
xml.prototype.header = function(process){
    var process     =   {'process':process};
    var xml         =   ' <bpmn:definitions xmlns:bpmn=\'http://www.omg.org/spec/BPMN/20100524/MODEL\' ' +
                        ' xmlns:debugger=\'http://e2e.ch/bpmneditor/debugger\'> ' +
                        ' <bpmn:process id=\'#{process}\'> ';
    return(S(xml).template(process, '#{', '}').s);
};
xml.prototype.timeOut  = function(id, name, parent){
    var data    =   {id:id, name:name, parent:parent};
    var xml     =   ' <bpmn:boundaryEvent name=\'#{name}_Timeout\' attachedToRef=\'#{parent}\' label=\'#{name}_Timeout\' id=\'#{id}\'> ' +
                        ' <bpmn:timerEventDefinition/> ' +
                    ' </bpmn:boundaryEvent> ';
    return(S(xml).template(data, '#{', '}').s);
};
module.exports = xml;
