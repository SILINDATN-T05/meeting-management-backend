
var post_util       =     exports = module.exports = {};
var https           =     require('https');
var http            =     require('http');
var fs              =     require('fs');
var url             =     require('url');
var SB              =     require('stringbuilder');
var S               =     require('string');
var async           =     require('async');


post_util.post    =   function(uri, headers, action, payload, callback) {
    var contentLength   =   payload.length;
    var uri             =   url.parse(uri);
    var options =   {
        url:            uri.href,
        method:         'POST',
        SOAPAction:     action,
        hostname:       uri.hostname,
        port:           uri.port||443,
        path:           uri.pathname,
        host:           uri.hostname,
        headers:{
            'Content-Length': contentLength
        }
    };
    options.body    =  payload;
    console.error(options);
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
            var sb = new SB('');
            var code = '00';
            var req = https.request(options, function (res) {
                code = res.statusCode;
                res.on('data', function (data) {
                    sb.append(data);
                });
            });
            req.end();
            req.on('error', function (e) {
                console.error(e);
                return callback('request.backend.error');
            });
            req.on('end', function (e) {
                sb.toString(function (err, str) {
                    return callback(err, str);
                });
            });
        }catch(e){
            return callback(e);
        }
    });
};
module.exports  =  post_util;
