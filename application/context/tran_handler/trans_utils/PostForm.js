
var request     =   require('request');
var helper      =   exports = module.exports = {};
var async       =   require('async');
var S           =   require('string');

helper.post   =    function(url, headers, payload, callback) {
    try {
        if (typeof payload != 'object') {
            payload = JSON.parse(payload);
        }


    }catch (e)
    {
        console.log("exception",e)
    }
    var options = {
        url:url, timeout:20000,
        headers: headers,
        form:payload
    };
    try{
            request.post(options,  function(error, response, body) {
                if(!error && response.statusCode == 200) {
                    return callback(null, body);
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
