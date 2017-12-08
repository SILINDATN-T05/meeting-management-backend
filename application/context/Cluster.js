
var isMaster        =   undefined;
var masterId        =   undefined;
var masterPM_Id     =   undefined;
var pm2             =   require('pm2');
var path            =   require('path');
var serverScript       =   path.normalize(__dirname+'/../../bin/SERVER');
var startUp         =   __dirname+'/serviceStartup.js';
var logger          =   require('winston');

var Cluster = function(){
    var self    =   this;
    var timeout =   3000;
    setInterval(function(){
        timeout     =   20000;
        self._isMaster();
    }, timeout);
};

Cluster.prototype.isMaster  =   function(callback){
    setTimeout(function(){ if(!callback || callback === undefined){
        return;
    }
    if(isMaster === undefined){
        return callback(new Error('#process.cluster.starting'));
    }
    return callback(null, isMaster, masterPM_Id);

    },5000);
};
Cluster.prototype.locateMaster  =   function(callback){
    if(!callback || callback === undefined){
        return;
    }
    if(isMaster === undefined){
        return callback(new Error('#process.cluster.starting'));
    }

    return callback(null, masterId, masterPM_Id);
};
Cluster.prototype.locatePMID    =   function(callback){
    pm2.connect(function(){
        pm2.list(function(err, ret){
            if(!err){
                for(var i in ret){
                    var pro =   ret[i];
                    if(pro.pm2_env.pm_exec_path === serverScript){
                        if(pro.pid === process.pid){
                            pm2.disconnect(function(err, prc){
                                if(err) {
                                    logger.error(err);
                                }
                                logger.debug(prc);
                            });
                            return callback(null, pro.pm_id);
                        }
                    }
                }
                pm2.disconnect(function(err, prc){
                    if(err) {
                        logger.error(err);
                    }
                    logger.debug(prc);
                });

                return callback(new Error('#process.cluster.pmid.invalid'));
            }
        });
    });
};
Cluster.prototype._isMaster  =   function(){
    var data    =   {};
    pm2.connect(function(){
        pm2.list(function(err, ret){
            if(!err){
                for(var i=0; i< ret.length; i++){
                    var pro =   ret[i];
                    if(pro.pm2_env.pm_exec_path.toLowerCase() === serverScript.toLowerCase()){
                        data[pro.pm_id] = pro.pid;
                    }
                }
                var keys    =   Object.keys(data);
                var parent  =   keys.shift();
                isMaster    =   (data[parent] === process.pid);
                masterId    =   data[parent];
                masterPM_Id =   parent;
                pm2.disconnect(function(err, prc){
                    if(err) {
                        logger.error(err);
                    }
                    if(prc) {
                        logger.debug('Disconnect status: ', prc);
                    }
                });
            }else{
                logger.error(err);
            }
        });
    });
};
Cluster.prototype.killNamed  =   function(name, callback){
    pm2.connect(function() {
        pm2.delete(name, function(error){
            pm2.disconnect(function(err, prc){
                callback(error);
            });
        });
    });
};
Cluster.prototype.probe =   function(name, callback){
    pm2.connect(function(){
        pm2.list(function(err, ret){
            if(!err && ret){
                for(var i in ret){
                    var pro =   ret[i];
                    if(pro.name === name){
                        pm2.disconnect(function(err, prc){
                            callback(null, true);
                        });

                        return;
                    }
                }
            }else{
                callback(err);
            }
            callback(null, false);
            pm2.disconnect(function(err, prc){
                if(err) {
                    logger.error(err);
                }
                logger.debug(prc);
            });
        });
    });
};
Cluster.prototype.startOrg  =   function(name, args, callbck){
    pm2.connect(function(){
        var options =   {
            name:           name,
            scriptArgs :    args,
            force:          true,
            "--node-args": "--max-old-space-size=1024",
            "max_memory_restart" : "1024M"
        };
        var cores   =   args.pop();
        if(cores && cores > 1){
            options.instances=cores;
        }
        pm2.start(startUp, options, function(err, res){
            logger.debug('Starting app: ', res);
            pm2.disconnect(function(e, prc){
                if(err){
                    logger.error('Failed to start:', name, ', error:', err);
                }

                return callbck(err, prc);
            });
        });
    });
};
Cluster.prototype.locateScrit   =   function(){
    return serverScript;
};
module.exports  =   new Cluster();
