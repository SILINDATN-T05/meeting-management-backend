
var async                   =   require('async');
var log4js                  =   require('log4js');
var MessageLocator          =   require('../service/MessageLocator');
var HttpServer              =   require('./server/http_server');
var pdfService     =   require('../../context/service/pdf_service');
var server                  =   new HttpServer();
var messageLocator          =   new MessageLocator();
var TRAN_NAME               =   'transaction';
var TRAN_EQN                =   'transaction_enq';
var handlers                =   {};
var properties              =   {};
var logger                  =   log4js.getLogger('ORG_SERVER');

var Server = function(){

};

var isRequestValid =   function(request){
    return request !== undefined  && request.target;
};

var serverHandler    =   function(request, response){

    if(!isRequestValid(request)){
        response.send({code:'06', message:'#org.payload.invalid'});

        return;
    }
    var data        =   request.data;
    var user        =   request.user;
    var action      =   request.action;
    var target      =   request.target;
    var wrapper     =   {
        send:   function(data){
            messageLocator.locateMessage(data, user, function(result){
                response[server.render()](result);
            });
        }
    };
    async.waterfall([
        function doHandler(next){
            var handler     =   handlers[target] || handlers.all;
            if(typeof handler === 'object'){
                if(action){
                    handler =   handler[action];
                    if(typeof handler === 'function'){
                        next(null, handler);
                    }else{
                        next(new Error('#service.handler.cascading.invalid'));
                    }
                }else{
                    next(new Error('#service.handler.action.invalid'));
                }
            }else if(typeof handler === 'function'){
                next(null, handler);
            }else{
                next(new Error('#service.handler.invalid'));
            }
        },
        function doEnquiryHandler(handler, next){
            if(target === TRAN_NAME){
                if(data && data.server_ref && data.server_ref!==null){
                    handler     =   handlers[TRAN_EQN];
                    if(handler){
                        next(null, handler);
                    }else{
                        next(new Error('#service.enq_handler.missing'));
                    }
                }else{
                    next(null, handler);
                }
            }else{
                next(null, handler);
            }
        }
    ], function done(err, handler){
        if(!err && handler){
            handler(user, data, wrapper, properties);
        }else{
            wrapper.send({code:'06', message:err.message});
        }
    });
};

Server.prototype.handle    =   function(target, handler){
    handlers[target]    =   handler;
};
Server.prototype.setProperty    =   function(name, value){
    properties[name]=   value;
};
Server.prototype.getProperty    =   function(name){
    return properties[name];
};
Server.prototype.getProperties    =   function(){
    return properties;
};
Server.prototype.all    =   function(callback){
    handlers.all = callback;
};
Server.prototype.startUp  =   function(port){
    server.startUp(port, serverHandler, function(err){
        if(!err){
            //transactionService.startServices();
            logger.info('SERVICE READY :', new Date());
        }
    });
};
module.exports  =   Server;
