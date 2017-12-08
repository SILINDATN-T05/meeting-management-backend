
var request         =   require('request');
var async           =   require('async');
var S               =   require('string');
var helper          =   exports = module.exports = {};

helper.put   =    function(url, headers, payload, callback) {
    var options = {
        uri:url,
        method:'PUT',
        json:payload,
        pool: {
            maxSockets : 100
        },
        headers:{}
    };
    async.forEachOf(headers, function(param, key, next){
        if(key==='headers'){
            async.forEachOf(param, function(value, header, cb){
                options.headers[header]  =   value;
                cb();
            }, function _done(){
                next();
            });
        }else{
            options[key]  =   param;
            next();
        }
    }, function done(){
        try{
            request.put(options,  function(error, response, body) {
                if(!error && response.statusCode == 200) {
                    callback(null, body);
                }else{
                    if(error && error.code && error.code === 'ETIMEDOUT') {
                        callback('#put.request.timedout');
                    }else if(error && error.code && error.code === 'ECONNREFUSED'){
                        callback('#put.connection.refused');
                    }else{
                        if(error && error.code){
                            callback('#put.request.error.'+error.code);
                        }else{
                            callback('#put.request.error.undefined');
                        }
                    }
                }
            });
        }catch(e){
            if(e.code === 'ETIMEDOUT'){
                callback('#put.request.timedout');
            }else{
                callback('#put.request.exception');
            }
        }
    });
};
module.exports  =  helper;

