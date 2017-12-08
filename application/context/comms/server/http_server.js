
var express             =   require('express');
var parser              =   require('body-parser').json({limit:'500mb'});
var http                =   require('http');
var https                =   require('https');
var log4js              =   require('log4js');
var serverContext       =   express();
var logger              =   log4js.getLogger('ORG_CONTEXT');


function Server(){
}
Server.prototype.render =   function(){
    return'json';
};
Server.prototype.startUp    =   function(port, handler, callback){
    serverContext.post('/process', parser, function(req, res, next){
        handler(req.body, res, next);
    });
    serverContext.all('*', parser, function(req, res){
        res.send({code:'07', message:'#org.entry.invalid'});
    });
    var server =   http.createServer(serverContext);
    server.listen(port);
    server.on('error', function(err){
        logger.error('Failed to start service, exiting');
        callback(err);
        process.exit(1);
    });
    server.on('listening', function(){
        var addr = server.address();
        var bind = typeof addr === 'string'
            ? 'pipe ' + addr
            : 'port ' + addr.port;
        logger.info('ORG STARTED : '+ new Date(), ', BOUND TO : ', bind);
        serverContext.emit('started');
        callback(null);
    });
};
module.exports  =   Server;
