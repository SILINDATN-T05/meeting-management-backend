
var Process         =   require('../../model/Process-model');
var Org             =   require('../../model/Organisation-model');
var async           =   require('async');
var config          =   require('../../engine/Config');
var cluster         =   require('./Cluster');
var logger          =   require('winston');

var ProcStore = function(service){
    cluster =   service;
};
ProcStore.prototype.list    =   function(callback){
    Process.find({}, function(err, docs){
        return  callback(err, docs);
    });
};
ProcStore.prototype.outOfSync    =   function(callback){
    Org.find({sync_languages: true}, function(err, docs){
        return  callback(err, docs);
    });
};
ProcStore.prototype.listStatus    =   function(status, callback){
    Process.find({status:status}, function(err, docs){
        if(err) {
            logger.error(err);
        }

        return  callback(err, docs);
    });
};
ProcStore.prototype.sync    =   function(callback){
    var self    =   this;
    var count   =   0;
    Org.find({system: 'NO'}, function(err, docs){
        if(err) {
            logger.error(err);
        }
        async.eachSeries(docs, function proc(doc, cb){
            Process.findOne({name: doc.organisationName}, function(err, p){
                if(err) {
                    logger.error(err);
                }
                if(!err && p){
                    cb();
                }else{
                    count += 1;
                    var pross       =   new Process();
                    pross.name      =   doc.organisationName;
                    pross.conn      =   JSON.stringify(doc.dbConn);
                    pross.cluster   =   doc.cluster_size || 1;
                    pross.action.push({action:'LOADED', user:'SYSTEM', reason:'AUTO SCHEDULED' });
                    self.nextPort(function(err, port){
                        if(err) {
                            logger.error(err);
                        }
                        pross.port  =   port;
                        pross.save(function(err){
                            if(err) {
                                logger.error(err);
                            }
                            cb();
                        });
                    });
                }
            });
        }, function done(){
            callback(null, docs.length, count);
        });
    });
};
ProcStore.prototype.reverseSync    =   function(callback){
    Process.find({}, function(err, docs){
        if(err) {
            logger.error(err);
        }
        async.eachSeries(docs, function proc(doc, cb){
            Org.findOne({organisationName: doc.name}, function(err, p){
                if(!err && p){
                    cb();
                }else{
                    if(cluster){
                        cluster.killNamed(doc.name, function(err){
                            if(err) {
                                logger.error(err);
                            }
                            doc.remove(function(){
                                cb();
                            });
                        });
                    }else{
                        cb();
                    }
                }
            });
        }, function done(){
            callback();
        });
    });
};

ProcStore.prototype.clearCache    =   function(callback){
    var self    =   this;
    self.list(function(err, docs){
        if(err) {
            logger.error(err);
        }
        async.eachSeries(docs, function proc(doc, cb){
            doc.remove(function(){
                cb();
            });
        }, function don(){
            self.sync(function(err, size, syncd){
                return callback(err, size, syncd);
            });
        });
    });
};

ProcStore.prototype.locateRoute  =   function(name, callback){
    var self    =   this;
    self.locateByName(name, function(err, doc){
        if(!err && doc && doc.status==='RUNNING'){
            return callback(null, doc.port);
        }else{
            if(doc){
                return callback('#org.route.status.'+doc.status);
            }else{
                return callback('#org.route.invalid');
            }
        }
    });
};
ProcStore.prototype.locateByName  =   function(name, callback){
    Process.findOne({name: name}, function(err, doc){
        return callback(err, doc);
    });
};
ProcStore.prototype.updateStatus  =   function(name, status, callback, user, reason){
    var self    =   this;
    self.locateByName(name, function(err, doc){
        if(!err && doc){
            doc.status      =   status;
            doc.attempts    =   status === 'STARTING' ? doc.attempts + 1 : doc.attempts;
            if(user){
                doc.action.push({action:status, user: user, reason:reason});
            }else{
                doc.action.push({action:status, user:'SYSTEM', reason:'AUTO' });
            }
            if(status==='SCHEDULED'){
                self.nextPort(function(err, port){
                    if(err) {
                        logger.error(err);
                    }
                    doc.port = port;
                    doc.save(function(){
                        return  callback();
                    });
                });
            }else{
                doc.save(function(){
                    return  callback();
                });
            }
        }else{
            return  callback(new Error('#proc.locate.update.invalid'));
        }
    });
};

ProcStore.prototype.cluster  =   function(name, cluster, callback){
    var self    =   this;
    self.locateByName(name, function(err, doc){
        if(!err && doc){
            doc.cluster      =   cluster;
            doc.save(function(){
                return  callback();
            });
        }else{
            return  callback(new Error('#proc.locate.update.invalid'));
        }
    });
};

ProcStore.prototype.nextPort    =   function(callback){
    Process.findOne({}).sort({'port': -1})
    .exec(function(err, doc){
        if(!err && doc){
            return callback(null, doc.port + 1);
        }else{
            return callback(null, config.server.service_init_port);
        }
    });
};

module.exports  =   ProcStore;
