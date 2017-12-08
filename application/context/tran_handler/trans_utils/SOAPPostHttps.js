

var post_util       =   exports = module.exports = {};
var request         =   require('request');
var parser          =   require('xml-parser');
var S               =   require('string');
var fs              =   require('fs');
var async           =   require('async');
var Agent           =   require('agentkeepalive');

post_util.post      =   function(url, headers, action, payload, callback) {
    var contentLength   =   payload.length;

    headers['Content-Length'] = contentLength;
    headers.timeout = headers.timeout || 30000;
    headers.SOAPAction = action;

    var options =   {
        url: url,
        timeout:200000,
        pool: {maxSockets: 10000},
        method:'POST',
        SOAPAction: action,
        headers: headers,
        agentOptions : {
            rejectUnauthorized : false,
            ciphers: 'ALL',secureProtocol: 'TLSv1_method'

        }
    };
    options.body    =  payload;
    try{
        request.post(options, function (err, response, body) {
            if(!err && response && response.statusCode == 200) {
                return callback(null, body);
            }else if(!err && response && response.statusCode == 500 && body){
                var _result  =   parser(body);
                if(_result && _result.root !=undefined){
                    return callback(null, body);
                }else{
                    if(response.statusCode) {
                        return callback('backend.response.soap.invalid.'+response.statusCode);
                    } else {
                        return callback('backend.response.soap.invalid.06');
                    }
                }
            }else{
                if(err) {
                    if(err.code) {
                        return callback('process.backend.error.code.'+err.code);
                    } else {
                        return callback('process.backend.error.code.06');
                    }
                }else{
                    if(response && response.statusCode) {
                        return callback('process.backend.error.code.' + response.statusCode);
                    }else{
                        return callback('process.backend.error.code.06');
                    }
                }
            }
        });
    }catch(e){
        return callback('process.backend.error.message');
    }
};

module.exports  =  post_util;
