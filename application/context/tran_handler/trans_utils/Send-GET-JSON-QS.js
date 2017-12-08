var request = require('request');
var helper = exports = module.exports = {};

helper.post = function(uri, contentType, payload, callback) {
    var options = {
        uri:uri,
        method:'GET',
        timeout:60000,
        qs:payload,
        pool: {
            maxSockets : 100
        }
    };
    try{
        request.post(options,  function(error, response, body) {
            if(!error && response.statusCode == 200) {
                return callback(null, body);
            }else{
                if(error && error.code && error.code === 'ETIMEDOUT'){
                    return callback('Request timeout');
                }else{
                    return callback(error);
                }
            }
        });
    }catch(e){
        if(e.code === 'ETIMEDOUT'){
            return callback('Request timeout');
        }else{
            return callback(e.message);
        }
    }
};

module.exports  =  helper;
