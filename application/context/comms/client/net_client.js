
var net             =   require('net');
var JsonSocket      =   require('json-socket');

var Net_Client      = function (){};

Net_Client.prototype.send   =   function(port, request, callback){
    try{
        var socket  =   new JsonSocket(new net.Socket());
        socket.connect(port, '127.0.0.1');
        socket.on('connect', function() {
            socket.sendMessage(request);
            socket.on('error', function(err){
                callback(err);
            });
            socket.on('message', function(message) {
                callback(null, message);
            });
        });
    }catch(e){
        callback(e.message);
    }
};
module.exports  =   Net_Client;

