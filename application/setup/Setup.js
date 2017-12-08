var setup           =       exports = module.exports = {};
var config_helper   =       require('./helper/config_helper');
var model_helper    =       require('./helper/model_helper');
var db_helper       =       require('./helper/db_helper');
var async           =       require('async');
var User            =       require('../../model/User-model');
var Language        =       require('../../model/Language-model');
var Org             =       require('../../model/Organisation-model');
var Application     =       require('../../model/Application-model');
var Role            =       require('../../model/Role-model');
var Perm            =       require('../../model/Permission-model');

module.exports  =   function(callback){
    async.waterfall([
        function schemaExist(next){
            model_helper.hasModelData(function(exist){
                if(exist && exist === true){
                    next(new Error(true));
                }else{
                    next(null);
                }
            });
        },
        function tempConfigExist(next){
            config_helper.hasTempFile(function(exist){
                next((exist && exist ===  true)? null: new Error(false));
            });
        },
        //-----------------------INIT SETUP -------------------//
        function doSetup(next){
            //var rollback    =   {};
            async.waterfall([
                function loadConfigData(cb){
                    config_helper.loadConfigData(function(data){
                        cb(null, data);
                    });
                },
                function locateSystemUser(data, cb){
                    db_helper.locateSystemAdmin(function(err, admin){
                        if(!err && admin){
                            cb(null, admin,  data);
                        }else{
                            var user        =   new User();
                            user.username   =   'system';
                            user.msisdn     =   '27123456789';
                            user.firstName  =   'SYSTEM';
                            user.lastName   =   'SYSTEM';
                            user.persist(user, function(err, admin){
                                if(!err && admin){
                                    cb(null, admin, data);
                                }else{
                                    cb(err);
                                }
                            });
                        }
                    });
                },
                function readPermsData(admin, data, cb){
                    config_helper.loadPermsData(function(perms){
                        cb(null, perms, admin, data);
                    });
                },
                function loadPermissions(perms_data, admin, data, cb){
                    async.eachSeries(perms_data, function iterator(item, _cb) {
                        var perm = new Perm(item);
                        perm.persist(admin, function (err, perm) {
                            _cb();
                        });
                    }, function done() {
                        Perm.find({channel: 'PORTAL', system: { $ne: 'NO' }}, function(err, perms){
                            cb(null, perms, admin, data);
                        });
                    });
                },
                function createLanguage(perms, admin, data, cb){
                    var language    =   new Language(data.language);
                    language.persist(admin, function(err, lang){
                        if(!err && lang){
                            cb(null, lang, perms, admin, data);
                        }else{
                            cb(err);
                        }
                    });
                },
                function createOrg(lang, perms, admin, data, cb){
                    var org                 =   new Org(data.org);
                    org.languages.push({org_default:true, language: lang});
                    org.persist(admin, function(err, system){
                        if(!err && system){
                            cb(null, system, lang, perms, admin, data);
                        }else{
                            cb(err);
                        }
                    });
                },
                function createApplication(system, lang, perms, admin, data, cb){
                    var application             =   new Application(data.application);
                    application.organizationID  =   system.organisationName;
                    application.permissions     =   perms;
                    application.persist(admin, function(err, app){
                        if(!err && app){
                            cb(null, app, system, lang, perms, admin, data);
                        }else{
                            cb(err);
                        }
                    });
                },
                function createRole(app, system, lang, perms, admin, data, cb){
                    var role            =   new Role();
                    role.description    =   'SERVER Admin Role';
                    role.name           =    system.organisationName+'_ADMIN';
                    role.organizationID =    system.organisationName;
                    role.permissions     =   perms;
                    role.persist(admin, function(err, doc){
                        if(!err && doc){
                            cb(null, doc, app, system, lang, perms, admin, data);
                        }else{
                            cb();
                        }
                    });
                }, function createAdmin(role, app, system, lang, perms, admin, data, cb){
                    var user   =   new User(data.user);
                    user.roles.push(role);
                    user.persist(admin, function(err, doc){
                        if(!err && doc){
                            cb(null, doc, role, app, system, lang, admin);
                        }else{
                            cb(err);
                        }
                    });
                }
            ], function _done(err, user, role, app, system, lang, admin){
                if(err){
                    async.waterfall([
                        function doRole(cb){
                            if(role){
                                role.remove(admin, {override:true}, function(){
                                    cb();
                                });
                            }else{
                                cb();
                            }
                        },
                        function doApplication(cb){
                            if(app){
                                app.remove(admin, {override:true}, function(){
                                    cb();
                                });
                            }else{
                                cb();
                            }
                        },
                        function doSystem(cb){
                            if(system){
                                system.remove(admin, {override:true}, function(){
                                    cb();
                                });
                            }else{
                                cb();
                            }
                        },
                        function doLanguage(cb){
                            if(lang){
                                lang.remove(admin, {override:true}, function(){
                                    cb();
                                });
                            }else{
                                cb();
                            }
                        },
                        function doUser(cb){
                            if(user){
                                user.remove(admin, {override:true}, function(){
                                    cb();
                                });
                            }else{
                                cb();
                            }
                        }
                    ],
                        function clean(){
                            next(err);
                        });
                }else{
                    next();
                }
            });
        }
        //-----------------------END SETUP---------------------//
    ], function done(err){
        if(!err){
            callback(true);
        }else{
            callback((err.message === 'true')? true:false);
        }
    });
};
