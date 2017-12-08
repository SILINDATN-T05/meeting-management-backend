var Message         =   require('../../model/Locale-model');
Language            =   require('../../model/Language-model');
var express         =   require('express');
var router          =   express.Router();
var logger          =   require('util');

router.post('/message/create', function(req, res) {
    var payload             = req.body;
    //var desc                = payload.description;
    var user                = payload.user;
    var message             = new Message();
    //message.name            = payload.name;
    message.code            = payload.code;
    message.description     = payload.description;
    message.organizationID  = payload.org;
    message.message         = payload.message;
    message.persist(user, function (err, doc) {
        if(!err && doc) {
            res.send({code: '00', message: 'success', data: doc});
        }else{
            res.send({code: '06', message: err.message});
        }
    });
});
router.post('/message/list', function(req, res){
    Message.find({}, function(err, docs){
        res.send({code:'00', message:'success', data:docs});
    });
});
router.post('/message/delete', function(req, res){
    var payload     =   req.body;
    var user        =   payload.user;
    var id          = payload.id;
    Message.findOne({_id:id}, function(err, doc){
        if(err || !doc){
            res.send({code:'06', message:'#message.delete.ntf'});
        }else{
            doc.remove(user, function(){
                res.send({code:'06', message:'success'});
            });
        }
    });
});
router.post('/message/edit', function(req, res){
    var payload     =   req.body;
    var user        =   payload.user;
    var id          =   payload._id;
    var name        =   payload.name;
    var c_ode       =   payload.code;
    var desc        =   payload.description;
    var msg         =   payload.message;

    Message.findOne({_id:id}, function(err, doc){
        if(!err  && doc){
            Message.findOne({code:c_ode, message:msg}, function(err, other){
                if(other){
                    res.send({code:'06', message:'#message.already.exists'});
                }else{
                    doc.message         =   msg[0];
                    doc.code            =   c_ode;
                    doc.description     =   desc;
                    doc.persist(user, function(err, doc){
                        if(!err && doc){
                            res.send({code:'00', message:'success', data:doc.message});
                        }else{
                            res.send({code:'06', message:'edit failed', error:err});
                        }
                    });
                }
            });
        }else{
            res.send({code:'06', message:'edit failed'});
        }
    });

});
router.post('/message/addLanguage', function(req, res) {
    var payload = req.body;
    var user = payload.user;
    var code = payload.code;

    Message.findOne({code:code, override:'YES'}, function(err, message){
        if(err || !message){
            res.send({code:'06', message:'there is an error'});
        }else{
            var msg = payload.message;
            if(msg && msg.length){
                for(var x = 0; x < msg.length; x++){
                    var d   =   msg[x];
                    message.message.push({language: d.language, text: d.text});
                }
            }
            message.persist(user, function(err, language){
                if(!err && language){
                    res.send({code:'00', message:'success', data:language});
                }else{
                    res.send({code:'06', message: '#language.add.failed', error:err, language:language});
                }
            });
        }
    });
});
module.exports = router;
