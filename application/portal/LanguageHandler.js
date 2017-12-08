
var Language           =   require('../../model/Language-model');
var express         =   require('express');
var router          =   express.Router();
var logger          =   require('util');


router.post('/language/create', function(req, res){
    var payload     =   req.body;
    var user        =   payload.user;
    var language    =   new Language();
    language.name   =   payload.name;
    language.code               =   payload.code;
    language.system_default     =   payload.system_default || false;
    language.persist(user, function(err, doc){
        if(!err && doc){
            res.send({code:'00', message:'success', data:doc});
        }else{
            res.send({code:'06', message:err.message});

        }
    });
});
router.post('/language/list', function(req, res){
    Language.find({}, function(err, docs){
        res.send({code:'00', message:'success', data:docs});
    });
});
router.post('/language/delete', function(req, res){
    var payload     =   req.body;
    var user        =   payload.user;
    var id          = payload.id;
    Language.findOne({_id:id}, function(err, doc){
        if(err || !doc){
            res.send({code:'06', message:'#language.delete.ntf'});
        }else{
            doc.remove(user, function(){
                res.send({code:'06', message:'success'});
            });
        }
    });
});
router.post('/language/edit', function(req, res){
    var payload     =   req.body;
    var user        =   payload.user;
    var id          =   payload.id;
    var name        =   payload.name;
    var c_ode       =   payload.code;

    Language.findOne({_id:id}, function(err, doc){
        if(!err  && doc){
            Language.findOne({name:name, code:c_ode}, function(err, other){
                if(other){
                    res.send({code:'06', message:'#Language.already.exists'});
                }else{
                    doc.name    =   name;
                    doc.code    =   c_ode;
                    doc.persist(user, function(err, doc){
                        if(!err && doc){
                            res.send({code:'00', message:'success', id:doc._id, code:doc.code});
                        }else{
                            res.send({code:'06', message:'edit failed'});
                        }
                    });
                }
            });
        }else{
            res.send({code:'06', message:'edit failed'});
        }
    });
});
module.exports = router;
