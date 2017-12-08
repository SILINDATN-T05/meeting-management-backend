
var Model                       =   require('../../../model/index');
var log4js                      =   require('log4js');
var logger                      =   log4js.getLogger('TRAN_TYPE_HANDLER');
var TransactionTemplate         =   Model.TransactionTemplate;
var S                           =   require('string');

var handler                     =   function () {};

handler.prototype.create = function (user, req, res) {
    TransactionTemplate.find({name: req.name}, function (err, info) {
        if(err) {
            logger.error(err);
        }
        if(info.length > 0) {
            res.send({code: '06', message: 'trantemplate.create.name.exist'});
        }else{
            var template = new TransactionTemplate(req);
            try{
                if(req.responseMapper){
                    var str                  =    S(req.responseMapper).collapseWhitespace().s;
                    var mapper               =   JSON.parse(str);
                    template.responseMapper  =   mapper;
                }
            }catch(e){
                res.send({code:'06', message:'#trantemplate.create.responsemapper.invalid'});

                return;
            }
            //----------------------------------//
            template.persist(user, function (err, info) {
                if(err) {
                    res.send({code: '06', message: err.message, data: err});
                }else{
                    res.send({code: '00', message: 'success', data: info});
                }
            });
        }
    });
};
handler.prototype.list =   function(user, req, res){
    TransactionTemplate.find({}, function(err, info) {
        if(err) {
            logger.error(err);
        }
        res.send({code:'00', message:'success', data:info});
    });
};

//====================================EDIT TEMPLATES

handler.prototype.edit =   function(user, req, res){
    var temp_id             =   req.temp_id;
    var temp_name           =   req.tempName;
    var desc                =   req.description;
    var action              =   req.action;
    var endpoint            =   req.endPoint;
    var msgTemplate         =   req.messageTemplate;
    var resMapper           =   req.responseMapper;

    TransactionTemplate.findOne({_id: temp_id}, function(err, doc){
        if(!err && doc){
            TransactionTemplate
            .findOne({action:action, name:temp_name, description:desc, endPoint:endpoint, messageTemplate:msgTemplate, responseMapper:resMapper}, function(err, other){
                if(err) {
                    logger.error(err);
                }
                if(other){
                    res.send({code:'06', message:'#TransactionTemplate.update.exists'});
                }else{
                    doc.name = temp_name;
                    doc.description = desc;
                    doc.action = action;
                    doc.endPoint = endpoint;
                    doc.messageTemplate = msgTemplate;
                    doc.responseMapper = resMapper;
                    doc.persist(user, function(err, doc){
                        if(!err && doc){
                            res.send({code:'00', message:'success'});
                        }else{
                            res.send({code:'06', message:'#TransactionTemplate.update.failed'});
                            logger.error('error--------------------------------------------------->', err);
                        }
                    });
                }
            });
        }else{
            res.send({code:'06', message:'#TransactionTemplate.update.failed'});
        }
    });
};

handler.prototype.delete = function (user, req, res) {
    var temp_id             =   req.temp_id;
    TransactionTemplate.findOne({_id: temp_id}, function (err, doc) {
        if(err) {
            logger.error(err);
        }
        if(doc){
            doc.remove(user, function(err){
                if(err) {
                    logger.error(err);
                }
                res.send({code: '00', message: 'success', data: doc});
            });
        }else{
            res.send({code: '06', message: '#tranTemplate.remove.invalid'});
        }
    });
};

module.exports  =   handler;

