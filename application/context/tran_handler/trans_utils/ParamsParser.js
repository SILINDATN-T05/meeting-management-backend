
var String    =   require('string');
var parser    =   exports = module.exports = {};
parser.build  =   function(options, template, prefix) {
    var messages    =   new String(JSON.stringify(template));
    for(var name in options) {
        var param   =   prefix+'.'+name;
        messages = messages.replaceAll('${' + param+'}', options[name]);
    }
    return(JSON.parse(messages.toString()));
};
module.exports  =  parser;
