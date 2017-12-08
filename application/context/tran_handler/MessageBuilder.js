
var S           =   require('string');

var PayloadBuilder = function(){};

PayloadBuilder.prototype.buildMessageTemplate   =   function(data, template, callback){
    var payload                         =  (typeof template == "string") ? template : JSON.stringify(template);
    var payload                         =   JSON.stringify(template);
    S.TMPL_CLOSE                        =   '}';
    S.TMPL_OPEN                         =   '${';
    try{
        payload      =   S(payload).template(data).s;

        return callback(null, payload);
    }catch(e){
        return callback(null, payload);
    }

};

module.exports  =   PayloadBuilder;
