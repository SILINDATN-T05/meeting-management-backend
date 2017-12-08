
var mongoose        = require('mongoose');
var Schema          = mongoose.Schema;
var Channel         =   require('./types/Channel');
var UserStates      =   require('./types/UserState');
var Device          =   require('./sub/Device-model');
var Auth            =   require('./sub/Auth-model');
var Config          =   require('./Configuration-model');
//-----------------MIDDLEWARE--------------//
var base            =   require('./plugins/BaseModel');
var auditor         =   require('./plugins/TrailsLogger');
var hook            =   require('./hooks/AuthDetail-hook');
//----------------------------------------//
var configName      =   'LOGIN_ATTEMPTS';
const AuthDetailSchema = new Schema({
    user:             { type:  Schema.ObjectId, ref: 'User', required:true},
    channel:          { type:  Channel},
    uuid:             { type: String,   required: true},// msisdn, did, username
    organizationID:   { type:  String, required: true    },
    device:           { type: Device},
    hash:             { type:  String, required: false   },
    status:           { type:  UserStates, default: 'NEW'},
    expiry_date:      { type:  Date, default: null},
    last_access:      { type:  Date, default: null},
    login_attemps:    { type:   Number, default: 0},
    device_history:   [Device],
    auth_history:     [Auth]
});
AuthDetailSchema.plugin(auditor);
AuthDetailSchema.plugin(base);
AuthDetailSchema.index({ user: 1,channel:1, organizationID:1, uuid:1}, { unique: true });

AuthDetailSchema.methods.resetAttempts  =   function (user, next) {
    var self            =   this;
    self.login_attemps  =   0;
    self.last_access    =   Date.now();
    self.persist(user, function () {
        next();
    });
}
AuthDetailSchema.methods.incrementAttempts  =   function (user, next) {
    var self            =  this;
    self.login_attemps  =   self.login_attemps +1;
    Config.findOne({name:configName}, function (err, config) {
        var maxTries    =   3;
        var locStatus   =   'BLOCKED';
        if(!err && config && config[self.channel] &&  typeof config[self.channel] === Number){
            maxTries    =   parseInt(config[self.channel]);
        }
        if(self.login_attemps > maxTries){
            self.status = locStatus;
        }
        self.persist(user, function () {
            next({status:locStatus, left:(maxTries - self.login_attemps) })
        });
    });
}
AuthDetailSchema.pre('save', function (next) {
    hook.preSave(this.isNew, this, next);
});
module.exports = mongoose.model('AuthDetail', AuthDetailSchema)