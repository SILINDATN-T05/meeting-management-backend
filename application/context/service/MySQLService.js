
var log4js = require('log4js');
var mysql = require('mysql');
var async = require('async');
var poolArray = [];

var logger = log4js.getLogger('MySQLService');

var config;
var pool;

function MySQLService(_config) {
    config = _config;
}


MySQLService.prototype.host = function(config){
    if(config && config.host){
        return config.host;
    }else{
        return(null);
    }
};

MySQLService.prototype.user = function(config){
    if(config && config.user){
        return config.user;
    }else{
        return(null);
    }
};

MySQLService.prototype.password = function(config){
    if(config && config.password){
        return config.password;
    }else{
        return(null);
    }
};

MySQLService.prototype.database = function(config){
    if(config && config.database){
        return config.database;
    }else{
        return(null);
    }
};

MySQLService.prototype.connectionLimit = function(config){
    if(config && config.connectionLimit){
        return config.connectionLimit;
    }else{
        return(null);
    }
};

MySQLService.prototype.debug = function(config){
    if(config && config.debug){
        return config.debug;
    }else{
        return(null);
    }
};

MySQLService.prototype.insecureAuth = function(config){
    if(config && config.insecureAuth){
        return config.insecureAuth;
    }else{
        return(null);
    }
};

MySQLService.prototype.getPool = function(callback) {

    var pool = poolArray.get(config.configName);
    if(pool) {
        callback(pool);
    } else {
        callback(null);
    }
};

MySQLService.prototype.openConnection = function(callback){

    var self = this;
    var options = {};

    mysql.set('debug', false);

    async.waterfall([
            function _host(next) {
                var host = self.host(config);
                if(host!=null){
                    logger = log4js.getLogger('MySQLService-'+host);
                    options['host'] = host;
                    next();
                }else{
                    next('#mysql.service.db.conn.host.invalid');
                }
            },
            function _user(next) {
                var user = self.user(config);
                if(user!=null){
                    options['user'] = user;
                    next(null, user);
                }else{
                    next('#mysql.service.db.conn.user.invalid');
                }
            },
            function _password(next) {
                var password = self.password(config);
                if(password!=null){
                    options['password'] = password;
                    next(null, password);
                }else{
                    next('#mysql.service.db.conn.password.invalid');
                }
            },
            function _database(next) {
                var database = self.database(config);
                if(database!=null){
                    options['database'] = database;
                    next(null, database);
                }else{
                    next('#mysql.service.db.conn.database.invalid');
                }
            },
            function _connectionLimit(next) {
                var connectionLimit = self.connectionLimit(config);
                if(connectionLimit!=null){
                    options['connectionLimit'] = connectionLimit;
                    next(null, connectionLimit);
                }else{
                    next('#mysql.service.db.conn.connectionLimit.invalid');
                }
            },
            function _debug(next) {
                var debug = self.debug(config);
                if(debug!=null){
                    mysql.set('debug', debug);
                    options['debug'] = debug;
                    next(null, debug);
                }else{
                    next('#mysql.service.db.conn.debug.invalid');
                }
            },
            function _insecureAuth(next) {
                var insecureAuth = self.insecureAuth(config);
                if(insecureAuth!=null){
                    options['insecureAuth'] = insecureAuth;
                    next(null, insecureAuth);
                }else{
                    next('#mysql.service.db.conn.insecureAuth.invalid');
                }
            },


            function _connect(next) {

                mysql.Promise = global.Promise;
                var pool = poolArray.get(config.configName);
                if(pool) {
                    callback(pool);
                } else {
                    pool = mysql.createPool(options, function(err){
                        next(err, pool.connection);
                    });
                    poolArray.push(pool);
                }
                next(pool);

            },
            //------------- LISTERN EVENTS ------------//
            function (pool, next) {
                pool.on('disconnecting', function () {
                    logger.fatal(' DISCONNECTING POOL');
                    pool.end(function (err) {
                        if(err) {
                            logger.error(err);
                        } else {
                            logger.info('POOL DISCONNECTED');
                            callback();
                        }
                    });
                });
                pool.on('disconnected', function () {
                    logger.fatal(' DISCONNECTED POOL: ', new Date());
                    pool.end(function (err) {
                        if(err) {
                            logger.error(err);
                        } else {
                            logger.info('POOL DISCONNECTED');
                            callback();
                        }
                    });
                    //process.exit(1);
                });
                pool.on('close', function () {
                    logger.fatal(' POOL CLOSED : ', new Date());
                    pool.end(function (err) {
                        if(err) {
                            logger.error(err);
                        } else {
                            logger.info('POOL DISCONNECTED');
                            callback();
                        }
                    });
                    //process.exit(1);
                });
                pool.on('error', function (err) {
                    logger.fatal(' SHUTTING DOWN POOL, ERROR:', err);
                    pool.end(function (err) {
                        if(err) {
                            logger.error(err);
                        } else {
                            logger.info('POOL DISCONNECTED');
                            callback();
                        }
                    });
                    //process.exit(1);
                });
                next();
            }
        ],
        function _done(err) {
            logger.info('MYSQL DATABASE POOL STATUS:', err? 'FAILED - '+err:'OK');
            callback(err, !err, options);
        });
};

module.exports = MySQLService;
