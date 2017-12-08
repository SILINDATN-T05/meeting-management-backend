
var request         =   require('request');
var async           =   require('async');
var S               =   require('string');
var helper          =   exports = module.exports = {};

helper.delete   =    function(url, headers, payload, callback) {
    var options = {
        uri:url,
        method:'DELETE',
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
            request.delete(options,  function(error, response, body) {
                if(!error && response.statusCode == 200) {
                    callback(null, body);
                }else{
                    if(error && error.code && error.code === 'ETIMEDOUT') {
                        callback('#delete.request.timedout');
                    }else if(error && error.code && error.code === 'ECONNREFUSED'){
                        callback('#delete.connection.refused');
                    }else{
                        if(error && error.code){
                            callback('#delete.request.error.'+error.code);
                        }else{
                            callback('#delete.request.error.undefined');
                        }
                    }
                }
            });
        }catch(e){
            if(e.code === 'ETIMEDOUT'){
                callback('#delete.request.timedout');
            }else{
                callback('#delete.request.exception');
            }
        }
    });
};
module.exports  =  helper;


