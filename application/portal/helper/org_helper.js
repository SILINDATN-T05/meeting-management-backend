
var helper                  =   exports = module.exports = {};
var Organisation            =   require('../../../model/Organisation-model');
var User                    =   require('../../../model/User-model');
var Role                    =   require('../../../model/Role-model');
var Permission              =   require('../../../model/Permission-model');
var Application             =   require('../../../model/Application-model');

helper.validateParams  =   function(data, skip, callback){
    //------------------------------------------------//
    var host            =   data.dbHost;
    var port            =   data.dbHostPort || '27017';
    var dbName          =   data.dbName;

    var adminPass       =   data.adminPassword;
    var name            =   data.organisationName;
    var application     =   data.application;
    var channel         =   data.channel;
    var msisdn          =   data.adminMsisdn;
    var dbUserPassword  =   (data.auth &&  data.auth=== true);
    //-----------------------------------------------//
    var dbUsername      =   data.dbUserName;
    var dbPassword      =   data.dbPassword;
    //----------------------------------------------------//
    if(!host){
        return callback('#organisation.create.dbhost.required');
    }
    if(!port){
        return callback('#organisation.create.dbport.required');
    }
    if(!dbName){
        return callback('#organisation.create.dbName.required');
    }
    if(skip){
        //-validate others
    }else{
        if(!adminPass){
            return callback('#organisation.create.adminPass.required');
        }
        if(!msisdn){
            return callback('#organisation.create.msisdn.required');
        }
    }
    if(!channel){
        return callback('#organisation.create.channel.required');
    }
    if(channel != 'PORTAL'){
        return callback('#organisation.create.channel.invalid');
    }
    if(!application){
        return callback('#organisation.create.application.required');
    }
    if(dbUserPassword === true){
        if(!dbUsername){
            return callback('#organisation.create.dbusername.required');
        }
        if(!dbPassword){
            return callback('#organisation.create.dbpassword.required');
        }
    }
    if(!name){
        return callback('#organisation.create.name.required');
    }
    if(skip){
        return callback();
    }
    //----------------------------------------------------------//
    Organisation.findOne({organisationName:name, override:'YES'}, function(err, org){
        if(org){
            return callback('#organisation.create.name.exist');
        }
        User.findOne({msisdn:msisdn, override:'YES'}, function(err, user){
            if(user){
                return callback('#organisation.create.user.exist');
            }
            return callback();
        });
    });
};
helper.createOrgApplication   =   function(data, user, url, callback){
    data['dbConn']  =   url;
    var organisation = new Organisation(data);
    organisation.persist(user, function(err, doc){
        if(err ||!doc){
            return callback('#organisation.create.failed');
        }
        Permission.find({channel: 'PORTAL'}, function(err, perms){
            var application = new Application({
                code:               doc.organisationName+'_001',
                name:               data.application,
                channel:            'PORTAL',
                organizationID:     doc.organisationName,
                permissions:perms
            });
            application.persist(user, function(err, app){
                if(err || !app){
                    doc.remove(user, function(){});
                    return callback('#organisation.create.application.failed');
                }
                return callback(err, doc, app);
            });
        });
    });
};
helper.createOrgAdminRole   =   function(data, org, user, callback){
    Permission.find({channel: 'PORTAL', system: { $ne: 'YES' }}, function(err, perms){
        var role = new Role({
            name:               org.organisationName+'_ADMIN',
            description:        'ADMIN',
            channel:            'PORTAL',
            organizationID:     org.organisationName,
            permissions:        perms
        });
        role.persist(user, function(err, doc){
            if(err ||!doc){
                return callback('#organisation.create.role.failed');
            }
            return callback(null, doc);
        });
    });
};
helper.createOrgAdminUser   =   function(data, org, role, user, callback){
    var admin   = new User({
        msisdn:         data.adminMsisdn,
        firstName:      data.firstName,
        lastName:       data.lastName,
        status:         'ACTIVE',
        roles:          [role],
        passwordDetails:    {
            hash:           data.adminPassword,
            status:         'ACTIVE'
        }
    });
    admin.persist(user, function(err, doc){
        if(err ||!doc){
            return callback('#organisation.create.admin.failed');
        }
        return callback(null, doc);
    });
};
module.exports  =   helper;
