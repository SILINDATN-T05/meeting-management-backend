
var request         =   require('request');
var async           =   require('async');
var S               =   require('string');
var helper          =   exports = module.exports = {};

helper.post   =    function(url, headers, payload, callback) {
    var options = {
        uri:url,
        method:'POST',
        json:payload,
        body:payload,
        pool: {
            maxSockets : 100
        },
        headers:headers
    };

        try{
            request.post(options,  function(error, response, body) {
                if(!error && response.statusCode == 200) {
                     callback(null, {code:'00',message:'success',data:body});
                }else{
                    if(error && error.code && error.code === 'ETIMEDOUT') {
                         callback('#post.request.timedout');
                    }else if(error && error.code && error.code === 'ECONNREFUSED'){
                         callback('#post.connection.refused');
                    }else{
                        if(error && error.code){
                             callback('#post.request.error.'+error.code);
                        }else{
                             callback('#post.request.error.undefined');
                        }
                    }
                }
            });
        }catch(e){
            if(e.code === 'ETIMEDOUT'){
                 callback('#post.request.timedout');
            }else{
                callback('#post.request.exception');
            }
        }
};
module.exports  =  helper;
