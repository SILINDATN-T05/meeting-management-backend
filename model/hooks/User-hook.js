var async       =   require('async');
var mongoose    =   require('mongoose');

function UserHook() {
    
}
UserHook.prototype.preSave  =   function (isNew, self, callback) {
    if(isNew && isNew === true){
        async.waterfall([
            function doUsername(next) {
                    self.findOne({username: self.username}, function (err, user) {
                       if(!err && user){
                           next('#user.create.username.taken');
                       }else{
                           next();
                       }
                    });
            },
            function doMsisdn(next) {
                self.findOne({msisdn: self.msisdn}, function (err, user) {
                    if(!err && user){
                        next('#user.create.msisdn.taken');
                    }else{
                        next();
                    }
                });
            }
        ],
        function (err) {
            callback(err);
        });
    }else{
        callback();
    }
}
module.exports  =   new UserHook();