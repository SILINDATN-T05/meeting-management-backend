
var request     =   require('request');
var helper      =   exports = module.exports = {};
var async       =   require('async');
var S           =   require('string');

helper.get   =    function(url, headers, callback) {
    var options = {
        url:url, timeout:20000,
        headers: headers
    };
    try{
            request.get(options,  function(error, response, body) {
                if(!error && response.statusCode == 200) {
                    return callback(null, {code:'00', message:'success',data:body});
                }else{
                    if(error && error.code && error.code === 'ETIMEDOUT'){
                        return callback('#post.request.timedout');
                    }else{
                        if(error){
                            return callback(error);
                        }else{
                            return callback('#post.request.error.'+response.statusCode);
                        }
                    }
                }
            });
        }catch(e){

            if(e.code === 'ETIMEDOUT'){
                return callback('#post.request.timedout');
            }else{
                return callback('#post.request.error.1');
            }
        }
};
module.exports  =  helper;
