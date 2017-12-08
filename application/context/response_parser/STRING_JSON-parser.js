

var ResponseParser          =   require('./Response-parser');
var responseParser          =   new ResponseParser();
var async                   =   require('async');
var S                       =   require('string');

var extractValue    =   function(param, data, callback){
    var parts   =   param.split('@')||[];
    var value   =   data;
    for(var index = 0; index < parts.length; index += 1) {
        value   =   value[parts[index]];
        if(value === undefined){
            return callback(value);
        }
    }
    callback(value);
};

responseParser.parseResult =   function(json, mapper, callback){
    var result  =   {};
    if(mapper && json){
        var str = json;
        // var str =   S(JSON.stringify(json)).replaceAll('$', 'dollarSign').s;
        // str = str.replace(/[\\]/g, "");
        // str = str.substring(1, str.length-1);
        try{
            json    =   JSON.parse(str);
        }catch(e){
            json    = str;
        }
        async.waterfall([
                function doParams(next) {
                    var params = {};
                    async.forEachOf(mapper.params, function (value, key, cb) {
                        if(value.indexOf('|') > -1) {
                            var parts = value.split('|');
                            params[parts.shift()] = key + '|' + parts.shift();
                        }else{
                            params[value] = key;
                        }
                        cb();
                    }, function done() {
                        next(null, params);
                    });
                }
            ],
            function done(err, params){
                if(!err && params){
                    async.forEachOf(params, function process(param, name, next){
                        extractValue(name, json, function(value){
                           result[param] = value;
                            next();
                        });
                    }, function _done(){
                        return callback(result);
                    });
                }else{
                    result.message =    '#mapper.code.validation.invalid';

                    return callback(result);
                }
            });
    }else{
        return callback(json);
    }
};

module.exports  =   responseParser;
