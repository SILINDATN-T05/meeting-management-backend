

var async           =   require('async');
var xml2js          =   require('xml2js');
var mapper          =   require('./map_helper');
var Config          =   require('../../model/Configuration-model');
var builder         =   new xml2js.Builder();
var options         =   {explicitArray: false, tagNameProcessors: [xml2js.processors.stripPrefix]};
var ISOMParser      =   function(){

}
ISOMParser.prototype.buildJSON  =   function(xml, callback){
    async.waterfall([
            function doParse(next){
                    xml2js.parseString(xml, options, function(err, json) {
                    if(!err && json){
                        var user        =   json.message.authHeader.$;
                        var data        =   json.message.isomsg.field;
                        var response    =   {};
                        async.forEachOf(data, function iterator(value, key, next){
                            var element =   value.$;
                            response[element.id]  = element.value;
                            next();
                        }, function _done(){
                            next(null, user, response);
                        });
                    }else{
                        next('#api_helper.isom.parser.error');
                    }
                });
            },
            function doMapper(user, data, next) {
                Config.findOne({name:"API_MAPPER"}, function (err, config) {
                    if(!err && config && config.value){
                        next(null,config.value, user, data);
                    }else{
                        next(null, mapper, user, data);
                    }
                });
            }
    ], function done(err, result, user, isom){
        if(!err && result){
            var data    =   {};
            async.forEachOf(mapper, function process(value, key,  next){
                data[value] = isom[key];
                //console.log('value:'+JSON.stringify(value)+'|key:'+JSON.stringify(key)+'|data[value]:'+JSON.stringify(data[value]));
                next();
            }, function _done(){
                callback(null, data, user);
            });
        }else{
            callback(err);
        }
    });
};
ISOMParser.prototype.buildISOM  =   function(json, callback){
    var data    =   {
        message:{
            isomsg:{
                '$':{direction: 'response'},
                field:[]
            }
        }
    };
    var inner   =   [];
    async.forEachOf(mapper, function process(value, key,  next){
        if(json[value]){
            inner.push({'$':{id:key, value: json[value]}});
        }
        next();
    }, function done(){
        data.message.isomsg.field =   inner;
        var xml = builder.buildObject(data);
        callback(null, xml);
    });
};
module.exports  =  new ISOMParser();
