var Config  =   require('../model/Configuration-model');
var async   =   require('async');

function ConfigService(){

}
ConfigService.prototype.list    =   function(callback){
    Config.find({}, function(err, data){
        if(!err && data){
            doc.value    = req.value;

            /*var data    =   {};
            async.eachSeries(docs, function(doc, cb){
                data[doc.name]  =   doc.value;
            }, function done(){

            });*/
        }else{
            callback('#config.locate.empty');
        }
    });
}

ConfigService.prototype.locate  =   function(name, callback){
    Config.findOne({name: name}, function(err, doc){
        if(!err && doc){
            callback(null, {name:doc.name, value:doc.value})
        }else{
            callback('#config.locate.ntf');
        }
    });
}

ConfigService.prototype.locateupdate  =   function(name,user, callback){
   Config.findOne({name: name}, function(err, doc){
        if(!err && doc){
            if (doc.refCount && doc.refCount>=1 && user) {
                doc.persist(user, function(err, doc){
                    if(!err){
                        callback(null, {name:doc.name, value:doc.value, refcount:doc.refCount})
                    }else{
                        callback('#config.save.'+name+'.error')
                    }
                });
            }
            else {
                    callback(null, {name:doc.name, value:doc.value, refcount:-1})
            }
        }else{
            callback('#config.locate.'+name+'.nft');
        }
    });
}
ConfigService.prototype.locateSync  =   function(name, callback){
    var result  =   Config.findOne({name: name}).exec();
    console.error(result);
    return(result);
}
ConfigService.prototype.delete  =   function(user, name, callback){
    Config.findOne({name: name}, function(err, doc){
        if(!err && doc){
            Config.remove(user, function(err){
                callback(null, null);
            });
        }else{
            callback('#config.locate.ntf');
        }
    });
}
ConfigService.prototype.edit  =   function(user, req, callback){
    Config.findOne({name: req.name}, function(err, doc){
        if(!err && doc){
           doc.value    = req.value;
            doc.persist(user, function(err, doc){
                callback(err, doc)
            });
        }else{
            callback('#config.locate.ntf');
        }
    });
}
ConfigService.prototype.create  =   function(user, req,  callback){
    var self    =   this;
    self.locate(req.name, function(err, doc){
       if(err && !doc){
           var config   =   new Config();
           config.name  =   req.name;
           config.value =   req.value;
           config.persist(user, function(err, doc){
              callback(err, doc);
           });
       } else{
           callback('#config.create.exist');
       }
    });
}
module.exports  =   ConfigService;