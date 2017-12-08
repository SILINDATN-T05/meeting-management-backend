
var async           =   require('async');
var ISOMParser      =   require('./base_parser/ISOMParser');

var Parser          =   function() {};

var extractSimpleData =   function(mapper, data, callback){
    var response    =   {};
    data            =   data||{};
    async.forEachOf(mapper, function process(param, name, cb){
        if(typeof  param ==='object'){
            async.forEachOf(param, function process(param1, name1, sb){
                if(data[name1] && data[name1]!=undefined){
                    response[param1]   =  data[name1];
                }
                sb();
            }, function f(){
                cb();
            });
        }else{
            if(param.indexOf('|')>-1){
                try{
                    var parts   =   param.split('|');
                    var value   =   data[parts.shift()];
                    var _value  =   value.split('|')[parts.shift()];
                    if(_value && _value!=undefined){
                        response[name] = _value;
                    }
                }catch(e){
                    //- ignore error response[name] = e;
                }
            }else{
                if(data[param] && data[param]!= undefined){
                    response[name] = data[param];
                }
            }
            cb();
        }
    }, function _done(){
        return callback(null, response);
    });
};

Parser.prototype.parseResult =   function(xml, mapper, callback){
    ISOMParser.buildJSON(xml, function(err, json){
        if(!err && json){
            async.waterfall([
                function(next){
                    extractSimpleData(mapper.params, json, function(err, response){
                        if(!err && response){
                            next(null, response);
                        }else{
                            next(new Error(err));
                        }
                    });
                }
            ], function done(err, response){
                if(!err && response){
                    callback(response);
                }else{
                    callback({code:'06', message:err.message});
                }
            });
        }else{
            callback({code:'06', message:err});
        }
    });
};

module.exports  =   Parser;
