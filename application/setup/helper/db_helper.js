

var format                  =   require('util').format;
var client                  =   require('mongodb').MongoClient;
var helper                  =   exports = module.exports = {};
var User                    =   require('../../../model/User-model');
var config                  =   require('../../../engine/Config');
var buffer = require('fs').readFileSync(config.database.certLocation);
helper.locateSystemAdmin   =   function(callback){
    User.findOne({username:'system'}, function(err, admin){
        if(!err && admin){
            callback(null, admin);
        }else{
            callback('#system.init.invalid');
        }
    });
};
helper.createConn   =   function(){
    var args        =   Array.prototype.slice.call(arguments, 0);
    var callback    =   args.pop();
    var auth        =   args.shift();
    var data        =   args.shift();
    var url         =   '';
    var root        =   data.dbUserName;
    var pass        =   data.dbPassword;
    if(auth && auth === true){
        url =   format('mongodb://%s:%s@%s:%s/%s?authMechanism=DEFAULT&authSource=admin&ssl=true', root, pass, data.dbHost, data.dbHostPort, data.dbName);
    }else{
        url =   format('mongodb://%s:%s/%s', data.dbHost, data.dbHostPort, data.dbName);
    }
    try{

        client.connect(url, {
            server: {
                sslCA: buffer,
                sslValidate:false
            }
        }, function(err, db){
            if(!err && db){
                db.stats(function(err, stats){
                    if(!err){
                        callback(null, url);
                        db.close();
                    }else{
                        callback(err);
                        db.close();
                    }
                });
            }else{
                callback(err);
            }
        });
    }catch(e){
        callback(e);
    }
};
module.exports  =   helper;
