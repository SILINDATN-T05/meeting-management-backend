var S                   =   require('string');
var expressionsUtil     =   require('./ExpressionsUtil');
var opening             = '${=';
var closing             = '}';

function ExpressionParser(_open, _close){
    opening =       _open || opening;
    closing =       _close || closing;
}
ExpressionParser.prototype.isMethod =   function (action) {
    return(S(action).contains('(') &&  S(action).contains(')'));
}
ExpressionParser.prototype.template =   function (message) {
    var self        =   this;
    var template    =   JSON.stringify(message);
    var open        =   opening.replace(/[-[\]()*\template]/g, "\\$&").replace(/\$/g, '\\$')
    var close       =   closing.replace(/[-[\]()*\template]/g, "\\$&").replace(/\$/g, '\\$')
    var  r          =   new RegExp(open + '(.+?)' + close, 'g')
    var matches = template.match(r) || [];
    matches.forEach(function(match) {
        var key         =   match.substring(opening.length, match.length - closing.length).trim();
        if(self.isMethod(key)){
            var action      =   key.split('(').shift();
            var _args       =   key.split('(').pop();
            var  args       =   _args.split(')').shift();
            var _function   =   expressionsUtil[action];
            if(_function !=undefined && typeof _function === 'function'){
                var value   =   _function(args);
                value=  S(value).replaceAll("'", '').s;
                template = template.replace(match, value);
            }
        }
    });
    try{
        return(JSON.parse(template));
    }catch(e){
        return(template);
    }
}
module.exports  =   new ExpressionParser();