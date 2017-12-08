var async           =   require('async');
var User            =   require('../User-model');
var service         =   require('../../engine/HashService');
var hook            =   require('./Device-hook')

function AuthDetailHook() {

}
AuthDetailHook.prototype.preSave    =   function (isNew, self, callback) {
        if(isNew && isNew === true){
            async.waterfall([
                function doUser(next) {
                    User.findOne({_id: self.user}, function (err, user) {
                       if(!err && user){
                           next(err, user);
                       }else{
                           next('#user.auth.create.user.invalid');
                       }
                    });
                },
                function doUUID(user, next) {
                    if(self.uuid && self.uuid != undefined){
                        if(self.channel === 'APP'){
                            hook.validate(self.uuid, function (err) {
                                next(err, user);
                            });
                        }else{
                            if(self.uuid === user.username || self.uuid === user.msisdn){
                                next(null, user);
                            }else{
                                next('#user.auth.create.uuid.invalid');
                            }
                        }
                    }else{
                        self.uuid   =   (self.channel == 'USSD')? user.msisdn: user.username;
                        next(null, user);
                    }
                },
                function doValidate(user, next) {
                    var query   =   {   user:           self.user,
                                        channel:        self.channel,
                                        organizationID: self.organizationID
                                        };
                    if(self.channel === 'APP'){
                        query['uuid']= self.uuid;
                    }
                    self.findOne(query, function (err, auth) {
                        if(!err && auth){
                            next('#user.auth.create.exit');
                        }else{
                            next();
                        }
                    });
                },
                function doHash(next) {
                    if(!self.hash.startsWith("$"))
                    {
                        service.encrypt(self.hash, function (err, hash) {
                            if(!err && hash){
                                self.hash=  hash;
                                next();
                            }else{
                                next(err);
                            }
                        });
                    }else
                    {
                        next();
                    }
                }
            ],
            function done(err) {
                callback(err);
            });
        }else{
            callback();
        }
}
module.exports  =   new AuthDetailHook();