
var TranHandler     =   require('./TranHandler');
var handler         =   new TranHandler();
var post            =   require('request');
var qs              =   require('querystring');
var crypto = require('crypto');

handler.processStep =   function(uri, headers, action, payload, callback){

    var options = {
        url:"",
        method:"",
        headers: {

        }
    };

    if(action === "POST")
    {
        var hash = crypto.createHmac('sha256', headers.privateKey)
            .update("")
            .digest('base64');
        options.method = action;
        options.url = uri;
        options.headers = {'AuthorizationHash':hash,
        'ApiKey':headers.publicKey};
        options["form"] = payload;
    }else if(action === "GET")
    {
        var hash = crypto.createHmac('sha256', headers.privateKey)
            .update(payload)
            .digest('base64');

        options.method = action;
        options.url = uri+payload;
        options.headers =
        {'AuthorizationHash':hash,
         'ApiKey':headers.publicKey};

    }

    // var options = {
    //     url: uri+payload,
    //     method: action,
    //     headers: {
    //         'AuthorizationHash':hash,
    //         'ApiKey':headers.publicKey
    //     }
    // };
     post(options, function(err, response, body){
        if(!err && response.statusCode === 200){
            callback(null, body);
        }else{
            callback(err||'request.err.code.'+ response.statusCode);
        }
    });

};
module.exports  =   handler;
