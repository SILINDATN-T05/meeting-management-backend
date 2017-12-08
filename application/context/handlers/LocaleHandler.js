
var Model            =   require('../../../model/index');
var log4js           =   require('log4js');
var logger           =   log4js.getLogger('LOCALE_HANDLER');
var Message          =   Model.Message;

var handler          =   function() {};

handler.prototype.create =   function(user, req, res){
    var message        =   new Message(req);
    message.persist(user, function (err, msg) {

        if(!err && msg) {
            res.send({code: '00', message: 'success', data: msg});
        }else{
            if(err) {
                logger.error(err);
                res.send({code: '06', message: err.message});
            }else{
                res.send({code: '06', message: '#backend.err'});
            }
        }
    });
};

handler.prototype.list =   function(user, req, res){
    Message.find({})
    .populate('message.language')
    .exec({}, function(err, msg){
        if(!err){
            res.send({code: '00', message: 'success', data:msg});
        }else{
            res.send({code: '06', message: '#backend.err'});
        }
    });
};

module.exports  =   handler;
