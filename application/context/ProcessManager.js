
var pm2             =   require('pm2');
var log4js          =   require('log4js');
var async           =   require('async');
var proxy           =   require('./../context/comms/Router');
var db_helper       =   require('../setup/helper/db_helper');
var Language        =   require('../../model/Language-model');
var cluster         =   require('./Cluster');
var ProcStore       =   require('./ProcStore');

var META            =   1000*40;
var MLTA            =   1000*60*30;
var managerTime     =   META/10;
//var cluster         =   new Cluster();
var procStore       =   new ProcStore(cluster);
var scheduleAll     =   false;
var cacheUpdated    =   false;
var logger          =   log4js.getLogger('PROCESS_MANAGER');

var doScheduleAll   =   function(callback){
    procStore.listStatus('READY', function(err, docs){
        if(!err && docs) {
            async.eachSeries(docs, function proc(doc, cb) {
                procStore.updateStatus(doc.name, 'SCHEDULED', function(err){
                    if(err) {
                        logger.error(err);
                    }
                    cb();
                });
            }, function done() {
                callback();
            });
        }
    });
};

var _sync   =   function(callback){
    procStore.clearCache(function(err){
        if(err) {
            logger.error(err);
        }
        if(scheduleAll){
            doScheduleAll(function(){
                logger.info('CACHE CLEARED');
                callback();
            });
        }
    });
};

var sync_languages  =   function(callback){
    async.waterfall([
        function locateSystemUser(next){
            db_helper.locateSystemAdmin(function(err, admin){
                next(err, admin);
            });
        },
        function outOfSync(admin, next){
            procStore.outOfSync(function(err, orgs){
                next(err, orgs, admin);
            });
        },
        function doSync(orgs, admin, next){
            async.eachSeries(orgs, function(org, done){
                async.eachSeries(org.languages, function(ln, cb){
                    Language.findOne({_id:ln.language}, function(err, lang){
                        if(err) {
                            logger.error(err);
                        }

                        if(lang){
                            var res =   {
                                json:function onResponse(data){
                                    //logger.error(data);
                                    if(data.code && data.code === '00'){
                                        org.sync_languages  =   false;
                                        org.save(function(){
                                            cb();
                                        });
                                    }else{
                                        cb();
                                    }
                                }
                            };
                            var payload =   {path:'process/language/sync', language: lang, org_default: ln.org_default};
                            var req     =   { body:{user:admin}};
                            proxy.route(payload, req, res, null, org._id);
                        }else{
                            done();
                        }
                    });
                }, function done(){
                    next();
                });
            }, function clean(){
                callback();
            });
        }
    ],
    function done(){
        callback();
    });
};

var _parent =   function(response){
    procStore.listStatus('SCHEDULED', function(err, docs){
        if(!err && docs){
            async.eachSeries(docs, function proc(doc, cb){
                cluster.probe(doc.name, function(err, isRunning){
                    if(err) {
                        logger.error(err);
                    }
                    if(!err && isRunning){
                        procStore.updateStatus(doc.name, 'RUNNING', function(err){
                            if(err) {
                                logger.error(err);
                            }
                            cb();
                        });
                    }else{
                        //logger.error(err);
                        cb();
                    }
                });
            }, function done(){
                procStore.listStatus('SCHEDULED', function(err, docs){
                    if(err) {
                        logger.error(err);
                    }
                    async.eachSeries(docs, function _proc(doc, ccb){
                        cluster.startOrg(doc.name, doc.args, function(err){
                            if(err) {
                                logger.error(err);
                            }
                            procStore.updateStatus(doc.name, 'STARTING', function(err){
                                if(err) {
                                    logger.error(err);
                                }
                                ccb();
                            });
                        });
                    }, function _done(){
                        procStore.listStatus('STARTING', function(err, docs){
                            if(err) {
                                logger.error(err);
                            }
                            async.eachSeries(docs, function __proc(doc, cccb){
                                cluster.probe(doc.name, function(err, isRunning){
                                    if(err) {
                                        logger.error(err);
                                    }
                                    if(!err && isRunning){
                                        procStore.updateStatus(doc.name, 'RUNNING', function(err){
                                            if(err) {
                                                logger.error(err);
                                            }
                                            cccb();
                                        });
                                    }else{
                                        if(doc.attempts >= 4){
                                            procStore.updateStatus(doc.name, 'FAILED', function(err){
                                                if(err) {
                                                    logger.error(err);
                                                }
                                                cccb();
                                            });
                                        }else{
                                            procStore.updateStatus(doc.name, 'STARTING', function(err){
                                                if(err) {
                                                    logger.error(err);
                                                }
                                                cccb();
                                            });
                                        }
                                    }
                                });
                            }, function __done(){
                                procStore.listStatus('STOPPED', function(err, docs){
                                    if(err) {
                                        logger.error(err);
                                    }
                                    async.eachSeries(docs, function __proc(doc, _cccb) {
                                        cluster.probe(doc.name, function (err, isRunning) {
                                            if(err) {
                                                logger.error(err);
                                            }
                                            if(!err && isRunning){
                                                cluster.killNamed(doc.name, function(err){
                                                    if(!err){
                                                        procStore.updateStatus(doc.name, 'READY', function(err){
                                                            if(err) {
                                                                logger.error(err);
                                                            }
                                                            _cccb();
                                                        });
                                                    }else{
                                                        logger.error(err);
                                                    }
                                                });
                                            }else{
                                                procStore.updateStatus(doc.name, 'READY', function(err){
                                                    if(err) {
                                                        logger.err(err);
                                                    }
                                                    _cccb();
                                                });
                                            }
                                        });
                                    }, function ____done(){
                                        procStore.sync(function(){
                                            procStore.reverseSync(function(){
                                                sync_languages(function(){
                                                    return response();
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        }
    });
};

var _worker =   function(callback){
    _parent(function(){
        callback();
    });
};

var ProcessManager = function() {
    var finished    =   true;
    setInterval(function(){
        if(finished) {
            finished = false;
            cluster.isMaster(function (err, isMaster) {
                if (err || !isMaster) {
                    cacheUpdated = true;
                    return;
                }
                managerTime = MLTA;
                async.parallel([
                    function sync(next) {
                        if (cacheUpdated) {
                            next();
                        } else {
                            _sync(function () {
                                cacheUpdated = true;
                                next();
                            });
                        }
                    }
                ], function () {
                    _worker(function () {
                        finished    = true;
                    });
                });
            });
        }
    }, managerTime);
};

ProcessManager.prototype.startAll   =   function(){
    scheduleAll =   true;
};

ProcessManager.prototype.stopOrg  =   function(name, user, reason){
    procStore.updateStatus(name, 'STOPPED', function(err){
        if(err){
            logger.error(err);
        }
    }, user, reason);
};
ProcessManager.prototype.getOrgRoute  =   function(name, callback){
    procStore.locateRoute(name, function(err, route){
        //logger.info('ROUTING REQUEST [', name,'-', route,']', err?', ERROR:'+err:'');
        return callback(err, route);
    });
};
//====================== API ===================//
ProcessManager.prototype.listProcess  =   function(callback){
    procStore.list(function(err, docs){
        return callback(err, docs);
    });
};
ProcessManager.prototype.processDetail  =   function(name, callback){
    procStore.locateByName(name, function(err, doc){
        return callback(err, doc);
    });
};
ProcessManager.prototype.reloadSERVER  =   function(){
    cluster.locatePMID(function(err, pmid){
        if(err) {
            logger.error(err);
        }
        pm2.connect(function(){
            pm2.restart(pmid, function(err, ret){
                if(err) {
                    logger.error(err);
                }
                logger.debug(ret);
            });
        });
    });
};
ProcessManager.prototype.startProcess  =   function(name, user, reason, callback){
    procStore.locateByName(name, function(err, doc){
        if(err) {
            logger.error(err);
        }
        if(!err && doc){
            cluster.probe(name, function(err, isRunning){
                if(!err && !isRunning){
                    procStore.updateStatus(doc.name, 'SCHEDULED', function(e){
                        callback(e);
                    }, user, reason);
                }else{
                    if(isRunning){
                        callback('#process.start.running');
                    }else{
                        callback(err);
                    }
                }
            });
        }else{
            callback('#process.start.invalid');
        }
    });
};
ProcessManager.prototype.stopProcess  =   function(name, user, reason, callback){
    procStore.locateByName(name, function(err, doc){
        if(err) {
            logger.error(err);
        }
        if(!err && doc){
            cluster.probe(name, function(err, isRunning){
                if(err) {
                    logger.error(err);
                }
                if(!err && isRunning){
                    procStore.updateStatus(doc.name, 'STOPPED', function(e){
                        callback(e);
                    }, user, reason);
                }else{
                    if(!isRunning){
                        callback('#process.stop.stopped');
                    }else{
                        callback(err);
                    }
                }
            });
        }else{
            callback('#process.stop.invalid');
        }
    });
};
module.exports  =   ProcessManager;
