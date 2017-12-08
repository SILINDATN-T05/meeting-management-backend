var mongoose        = require('mongoose');
var Schema          = mongoose.Schema;
var async               =   require('async');
var helper              =   require('../engine/HashService');
var ttl                 =   require('./helper/session_ttl');
var User                =   require('./User-model');
var Role                =   require('./Role-model');
var Permission          =   require('./Permission-model');
var Channel             =   require('./types/Channel');
var TTL                 =   '15m';

var SessionSchema = new Schema({
    token:          {type: String,  required: false},
    startTime:      {type: Date,    required: true, default: Date.now},
    lastAccess:     {type: Date,    required: true, default: Date.now},
    organizationID: {type: String,  required: true},
    deviceId:       {type: String,  required: false},
    authenticated:  {type: Boolean, required: true, default: false},
    actions:       [{type: Schema.ObjectId, ref:  'SessionAction'}],
    application:    {type: Schema.ObjectId, required: false, ref:  'Apllication'},
    language:       {type: Schema.ObjectId, required: false, ref:  'Language' },
    user:           {type: Schema.ObjectId, required: false, ref:  'User'},
    channel:        {type: Channel,  required: true},
    permissions:    [String],
    session_actions: [{
        action_date: {type: Date,      required: false, default: Date.now},
        action:      {type: String,    required: false, default: ''},
        _id:         false,
    }],
    seed:           {
                        current_seed:   { type: String,  required: false},
                        previous_seed:  { type: String,  required: false},
                        next_seed:      { type: String,  required: false}
                    },
    transaction:   {type: Schema.ObjectId, required: false, ref:  'Transaction'},
});
SessionSchema.index({token: 1}, { unique: true });
SessionSchema.plugin(ttl, { ttl: TTL, interval:'30000',reap:true});
SessionSchema.virtual('isAuthenticated').get(function() {
    return(this.user && this.authenticated);
});
SessionSchema.virtual('hasPermission').get(function(currentPermission) {
    var self    =   this;
    if(!self.permissions){
        return(false);
    }
    self.permissions.forEach(function(permission){
        if(permission == currentPermission){
            return(true);
        }
    });
    return(false);
});
SessionSchema.post('remove',function(self){
    if(self && self.authenticated){
        User.findOne({_id: self.user}, function(err, user){
            if(!err && user){
                try{
                    user.addAccessHistory(self.session_actions);
                }catch(e){
                    console.log(e.stack);
                }
            }
        });
    }
});
SessionSchema.pre('save',function(next){
    var self =   this;
    if(self.isNew){
        helper.createToken(self._id.toString(), function(err, token){
            if(!err && token){
                self.token   =   token;
                next();
            }else{
                self.token   =   token;
                next(err);
            }
        })
    }else{
        next();
    }
});
/*
    AUTO EXPIRE SESSION
 */
SessionSchema.statics.processExpiredSessions=function(){
/*    var stream  =   this.remove().where('__ttl').lte(new Date).stream();
    stream.on('data', function (doc) {
        for(var index in doc){
            doc.remove();
        }
    });*/
}
/*
    UPDATE SESSIONS TTLS
 */
SessionSchema.methods.updateTTL =   function(callback){
    var self            =   this;
    self.lastAccess     =   getNextTick();
    self.save(function(err, doc){
        if(callback){
            callback(err, doc);
        }
    });
}
SessionSchema.methods.validateUser  =   function(user, callback){
    var instance    =   mongoose.model('UserSession', SessionSchema);
    instance.findOne({user:user._id}, function(err, doc){
        if(!err && doc){
           return callback(/*'You have another session open'*/);
        }else{
           return callback();
        }
    });

}
SessionSchema.methods.linkUser  =   function(user,application, org, callback){
    var self      =   this;
    self.validateUser(user, function(err){
        if(!err){
            self.getUserRoles(user, application, org,function(err, permissions){
                if(!err){
                    self.permissions        =  permissions;
                    self.user               =   user;
                    self.organisation       =   org;
                    self.application        =   application;
                    self.authenticated      =   true;
                    self.save(function(err, doc){
                        return callback(err, permissions);
                    });
                }else{
                    return callback(err);
                }
            });
        }else{
            if(callback){
                return callback(err);
            }
        }
    });
}
SessionSchema.methods.pushAction =   function(action, callback){
    var self    =   this;
    self.session_actions.push({action_date: Date.now(), action:action});
    self.save(function(err, doc){
            return callback(err, doc);
    });
}
SessionSchema.methods.getUserRoles  =   function(user, application, org, callback){
    var permissions =   [];
    var options     =   {_id: {$in: user.roles},organizationID:org.organisationName};
    Role.find(options, function (err, roles) {
        if(!err && roles && roles.length > 0){
            async.eachSeries(roles, function iterator(role, next) {
                var common_persm        =   [];
                var app_perms           =   [];
                async.eachSeries(application.permissions, function iterator(p, cb) {
                   app_perms.push(p.toString());
                    cb();
                }, function _done(){
                    async.eachSeries(role.permissions, function iterator(pp, _cb) {
                        if(app_perms.indexOf(pp.toString())>=0){
                            common_persm.push(pp);
                        }
                        _cb();
                    }, function __done(){
                        var query   =   {_id: {$in: common_persm},channel:application.channel};
                        Permission.find(query, function (err, perms) {
                            async.eachSeries(perms, function iterator(x, d) {
                                permissions.push(x);
                                d();
                            }, function f(){
                                next();
                            });
                        });
                    });
                });
            }, function done() {;
                if(permissions.length <1){
                    return callback('#login.org.permissions.invalid');
                }else{
                    callback(null, permissions);
                }
            });
        }else{
            return callback('#login.org.roles.invalid');
        }
    });
}
var getNextTick =   function(){
    var nextTick    =   new Date();
    nextTick.setMinutes(nextTick.getMinutes() + TTL);
    return(nextTick);
}
module.exports = mongoose.model('UserSession', SessionSchema);
