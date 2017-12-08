
var TranHandler     =   require('./TranHandler');
var handler         =   new TranHandler();
var post            =   require('request');
var qs              =   require('querystring');

handler.processStep =   function(uri, headers, action, payload, callback){
    post(uri + payload, function(err, response, body){
        if(!err && response.statusCode === 200){
            callback(null, body);
        }else{
            callback(err||'request.err.code.'+ response.statusCode);
        }
    });

};
module.exports  =   handler;
