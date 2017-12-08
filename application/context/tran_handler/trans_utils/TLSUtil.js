
var request      =      require('request');
var async        =      require('async');
var tls          =      require('tls');
var fs           =      require('fs');
var https        =      require('https');
var helper       =      exports = module.exports = {};

helper.post   =    function(url, headers, payload, callback, debug) {
    headers["ciphers"] = 'RC4-SHA';
    var port    =   url.split(':').pop();
    var host    =   url.split(':').shift();
    var result  =   '';
    if(debug != undefined && debug===true){
        console.error('HEADERS:\t', JSON.stringify(headers));
    }
    var socket = tls.connect(port, host, headers, function() {
        if(debug != undefined && debug === true){
            console.error('CIPHER:\t\t', socket.getCipher());
            console.error('AUTH_ERROR:\t', socket.authorizationError);
            console.error('IS_AUTH:\t', socket.authorized);
            console.error('NPN:\t\t', socket.npnProtocol);
        }
        socket.write(payload);
        socket.end();
    });
    socket.on('data', function(data) {
        result  +=data.toString('hex');
    });
    socket.on('secureConnection', function() {

    });
    socket.on('error', function(error) {
        socket.destroy();
        callback(error, result);
    });
    socket.on('end', function() {
        socket.destroy();
        callback(null, result);
    });
};
module.exports  =  helper;
