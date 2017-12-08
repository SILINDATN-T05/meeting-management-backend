
var Model            =   require('../../../model/index');
var Language         =   Model.Language;
var async            =   require('async');
var logger           =   require('winston');

function LanguageHandler() {

}
LanguageHandler.prototype.create  =   function(user, req, res){
    Language.findOne({code:req.code}, function(err, doc){
        if(err){
            res.send({code:'06', message:'Error from the backend'});
        }else{
            if(doc){
                res.send({code:'06', message:'Language already exist'});
            }else{
                var lang = new Language(req);
                lang.save(function(err, doc){
                    if(!err && doc){
                        res.send({code:'00', message:'success', data:doc});
                    }else{
                        res.send({code:'06', message:err.message});
                    }
                });
            }
        }
    });
};
/*
    system sync
 */
LanguageHandler.prototype.sync  =   function(user, req, res){
    var language        =   req.language;
    var system_default  =   req.org_default;
    async.waterfall([
        function resetDefault(next){
            if(system_default && system_default === true){
                Language.find({}, function(err, langs){
                    if(err) {
                        logger.error(err);
                    }
                    async.forEachOf(langs, function (lang, r, cb){
                        lang.system_default =   false;
                        lang.persist(user, function(){
                            cb();
                        });
                    }, function _done(){
                        next(null);
                    });
                });
            }else{
                next(null);
            }
        },
        function locateLang(next){
            Language.findOne({code:language.code}, function(err, doc){
                if(!err && doc){
                    next(null, doc);
                }else{
                    var lang                =   new Language();
                    lang.code               =   language.code;
                    lang.name               =   language.name;
                    next(null, lang);
                }
            });
        },
        function updateSynced(lang, next){
            lang.system_default     =   system_default;
            lang.persist(user, function(err, ln){
                next(err, ln);
            });
        }
    ],
    function done(err, lang){
        if(!err && lang){
            res.send({code:'00', message:'success'});
        }else{
            res.send({code:'06', message:'#language.sync.failed'});
        }
    });
};

LanguageHandler.prototype.list   =   function(user, req, res){
    Language.find({}, function(err, docs){
        if(err){
            res.send({code:'06', message:'Error from the backend'});
        }else{
            res.send({code:'00', message:'success', data:docs});
        }
    });
};

LanguageHandler.prototype.delete  =   function(user, req, res){
    Language.findOne({_id:req.id}, function(err, doc){
        if(err){
            res.send({code:'06', message:'Backend error'});
        }else{
            if(doc){
                doc.remove();
                res.send({code:'00', message:'success'});
            }else{
                res.send({code:'06', message:'Language does not exist'});
            }
        }
    });
};

LanguageHandler.prototype.edit  =   function(user, req, res){
    Language.findOne({_id:req.id}, function(err, doc){
        if(err){
            res.send({code:'06', message:'Backend error'});
        }else{
            if(doc){
                var update = {$set: {code: req.code, name: req.name}};
                Language.update({_id: doc._id}, update, function (err, doc){
                    if(!err){
                        res.send({code:'00', message:'success', data:doc});
                    }else{
                        res.send({code:'06', message:'Backend error'});
                    }
                });
            }else{
                res.send({code:'06', message:'Language does not exist'});
            }
        }
    });
};

LanguageHandler.prototype.getLanguage =   function(user, req, res){
    Language.findOne({code:req.code}, function(err, info) {
        if(err) {
            logger.error(err);
            res.send({code: '06', message: '#backend.error'});
        }else if(!info){
            res.send({code: '506', message: '#language.error', data: err});
        }else{
            res.send({code:'00', message:'success', data:info});
        }
    });
};

LanguageHandler.prototype.getDefault =   function(user, req, res){
    Language.findOne({system_default:true}, function(err, info) {
        if(err) {
            logger.info(err);
            res.send({code: '06', message: '#backend.error'});
        }else if(!info) {
            res.send({code: '506', message: '#language.error', data: err});
        }else{
            res.send({code:'00', message:'success', data:info});
        }
    });
};

module.exports  =   new LanguageHandler();
