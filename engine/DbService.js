var mongoose = require('mongoose');
var log4js = require('log4js');
var fs = require('fs');
var async = require('async');
var logger = log4js.getLogger('MONGO_ENGINE');
var config = null;

function DB(_config) {
    config = _config;
}

DB.prototype.dbUrl = function (config) {
    if (config && config.connectionString) {
        return config.connectionString;
    } else {
        return (null);
    }
}

DB.prototype.isSecure = function (config) {
    if (config && config.isSecure) {
        return config.isSecure;
    } else {
        return (null);
    }
}

// DB.prototype.certLocation = function (config) {
//     if (config && config.certLocation) {
//         return config.certLocation;
//     } else {
//         return (null);
//     }
// }

DB.prototype.getOptions = function (config) {
    if (config && config.options) {
        return config.options;
    } else {
        return (null);
    }
}

DB.prototype.getUser = function (config) {
    if (config && config.user) {
        return config.user;
    } else {
        return (null);
    }
}

DB.prototype.getPassword = function (config) {
    if (config && config.password) {
        return config.password;
    } else {
        return (null);
    }
}

DB.prototype.getAuthDB = function (config) {
    if (config && config.authdb) {
        return config.authdb;
    } else {
        return (null);
    }
}

DB.prototype.openConnection = function (callback) {
    var self = this;
    var options = {
        server: {
            poolSize: 100,
            socketOptions: {
                keepAlive: 120,
                auto_reconnect:true
            },
            ssl: true,
            sslValidate: true
        },
        auth: {},
        socketOptions: {
            keepAlive: 120,
            auto_reconnect:true
        }
    };
    mongoose.set('debug', false);
    //mongoose.set('info', false);
    if (self.isSecure(config) === "true") {
        async.waterfall([
                function _url(next) {
                    var url = self.dbUrl(config);
                    if (url != null) {
                        options['url'] = url;
                        next();
                    } else {
                        next('#engine.db.conn.url.invalid');
                    }
                },
                function _cert_location(next) {
                    var certLocation = self.certLocation(config);
                    if (certLocation != null) {
                        next(null, certLocation);
                    } else {
                        next('#engine.db.conn.cert_path.invalid');
                    }
                },
                function _cert_buffer(uri, next) {
                    var cert = [fs.readFileSync(uri)];
                    if (!cert || cert === null || cert == '') {
                        next('#engine.db.conn.cert_file.invalid');
                    } else {
                        options.server['sslCA'] = fs.readFileSync(uri);
                        next();
                    }
                },
                function _username(next) {
                    var user = self.getUser(config);
                    var password = self.getPassword(config);
                    if (user != null && user != undefined && password != null && password != undefined) {
                        options['user'] = user;
                        options['pass'] = password;
                        next();
                    } else {
                        next('#engine.db.conn.credentials.invalid');
                    }
                },
                function _auth_db(next) {
                    var authdb = self.getAuthDB(config);
                    if (authdb != null && authdb != undefined) {
                        options.auth['authdb'] = authdb;
                        next();
                    } else {
                        next('#engine.db.conn.auth_db.invalid');
                    }
                },

                function _connect(next) {
                    mongoose.Promise = global.Promise;
                    mongoose.connect(options.url, options, function (err) {
                        next(err, mongoose.connection);
                    });
                },
                //------------- LISTEN EVENTS ------------//
                function (conn, next) {
                    conn.on('disconnecting', function () {
                        logger.fatal(' DISCONNECTING');
                    });
                    conn.on('disconnected', function () {
                        logger.fatal(' DISCONNECTED : ', new Date());
                        process.exit(1);
                    });
                    conn.on('close', function () {
                        logger.fatal(' CONNECTION CLOSED : ', new Date());
                        process.exit(1);
                    });
                    conn.on('error', function (err) {
                        logger.fatal(' SHUTTING DOWN, ERROR:', err);
                        process.exit(1);
                    });
                    next();
                }
            ],
            function _done(err) {
                logger.info('DATABASE STATUS:', err ? 'FAILED - ' + err : 'OK');
                callback(err, !err, options);
            });
    } else {
        logger.info("Connecting to insecure database");
        async.waterfall([
                function _url(next) {
                    var url = self.dbUrl(config);
                    if (url != null) {
                        options['url'] = url;
                        next();
                    } else {
                        next('#engine.db.conn.url.invalid');
                    }
                },

                function _connect(next) {
                    mongoose.Promise = global.Promise;

                    options.server.ssl = false;
                    options.server.sslValidate = false;

                    mongoose.connect(options.url, options, function (err) {
                        next(err, mongoose.connection);
                    });
                },
                //------------- LISTEN EVENTS ------------//
                function (conn, next) {
                    conn.on('disconnecting', function () {
                        logger.fatal(' DISCONNECTING');
                    });
                    conn.on('disconnected', function () {
                        logger.fatal(' DISCONNECTED : ', new Date());
                        process.exit(1);
                    });
                    conn.on('close', function () {
                        logger.fatal(' CONNECTION CLOSED : ', new Date());
                        process.exit(1);
                    });
                    conn.on('error', function (err) {
                        logger.fatal(' SHUTTING DOWN, ERROR:', err);
                        process.exit(1);
                    });
                    next();
                }
            ],
            function _done(err) {
                logger.info('DATABASE STATUS:', err ? 'FAILED - ' + err : 'OK');
                callback(err, !err, options);
            });
    }
}
module.exports = DB;