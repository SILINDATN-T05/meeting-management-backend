
var Org            =    require('../../../model/Organisation-model');
var App            =    require('../../../model/Application-model');
var Role           =    require('../../../model/Role-model');
var Perm           =    require('../../../model/Permission-model');
var User           =    require('../../../model/User-model');
var Language       =    require('../../../model/Language-model');
var async          =    require('async');
var config_helper  =    require('./config_helper');
var helper         =   exports = module.exports = {};

helper.create_language  =   function(lang, callback){
    var language    =   new Language();
    language.name   =   lang.name;
    language.code   =   lang.code;

};
helper.loadPermissions  =   function(user, callback){
    config_helper.loadPermsData(function(data){
        async.eachSeries(data, function iterator(item, next) {
            var perm = new Perm(item);
            perm.persist(user, function (err, perm) {
                console.error('____PRM:', err, item);
                next();
            });
        }, function done() {
            Perm.find({channel: 'PORTAL', system: { $ne: 'NO' }}, function(err, perms){
                callback(err, perms);
            });
        });
    });
};
helper.createOrgApplication =   function(data, perms, user, callback){
    var org                 =   new Org();
    org.system              =   'YES';
    org.organisationName    =   'SYSTEM';
    org.persist(user, function(err, doc1) {
        if(!err && doc1) {
            var app             = new App();
            app.name            = data.application;
            app.code            = data.application;
            app.channel         = 'PORTAL';
            app.organizationID  = doc1.organisationName;
            app.description     = 'Admin Portal application for the SERVER';
            for(var i = 0; i < perms.length; i++) {
                app.permissions.push(perms[i]);
            }
            app.persist(user, function(err, doc){
                if(!err && doc){
                    return callback(null, doc1, doc);
                }else{
                    return callback('Failed to create application');
                }
            });
        }else{
            return callback('Failed to create Organisation');
        }
    });
};
helper.createAdminRole  =   function(org, perms, user, callback){
    var role            =   new Role();
    role.name           =   org.organisationName+'_ADMIN';
    role.description    =   'System Admin role';
    role.organizationID =   org.organisationName;
    for(var i = 0; i < perms.length; i++) {
        role.permissions.push(perms[i]);
    }
    role.persist(user, function(err, doc){
        if(!err && doc){
            return callback(null, doc);
        }else{
            return callback('Failed to create admin role');
        }
    });
};
helper.createAdminUser  =   function(data, callback){
    var admin   =   new User(data.user);
    admin.persist(admin, function(err, user){
        return callback(err, user);
    });
};
helper.hasModelData    =   function(callback){
    Org.find({}, function(err, orgs){
        if(!err && orgs){
            if(orgs.length === 0){
                callback(false);
            }else{
                Role.find({}, function(err, roles){
                    if(!err){
                        if(roles.length === 0){
                            callback(false);
                        }else{
                            User.count({}, function(err, users){
                                if(!err){
                                    if(users === 0){
                                        callback(false);
                                    }else{
                                        callback(true)
                                    }
                                }else{
                                    callback(true)
                                }
                            });
                        }
                    }else{
                        callback(true)
                    }
                });
            }
        }else{
            callback(false);
        }
    });
};
module.exports  =   helper;
