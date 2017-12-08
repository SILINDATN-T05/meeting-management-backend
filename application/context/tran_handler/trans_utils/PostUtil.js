
var request     =   require('request');
var async       =   require('async');
var S           =   require('string');
var helper      =   exports = module.exports = {};

helper.post   =    function(url, headers, payload, callback) {
    var options = {
        url:url, timeout:20000,
        headers: {
            'Content-Length': Buffer.byteLength(payload)
        },
        body:payload
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
            request.post(options,  function(error, response, body) {
                if(!error &&  response && response.statusCode == 200) {
                    return callback(null, body);
                }else{
                    if(error && error.code && error.code === 'ETIMEDOUT'){
                        return callback('#post.request.timedout');
                    }else{
                        if(error){
                            return callback('#post.request.error.4' +error);// error source
                        }else{
                            return callback('#post.request.backend.error.'+response.statusCode);
                        }
                    }
                }
            });
        }catch(e){
            if(e.code === 'ETIMEDOUT'){
                return callback('#post.request.timedout');
            }else{
                return callback('#post.request.error.5');
            }
        }
    });
};
module.exports  =  helper;
