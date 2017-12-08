
var express         =   require('express');
var router          =   express.Router();
var handler         =   express();
var logger          =   require('util');
var bodyParser      =   require('body-parser').json();
var User            =   require('../../model/User-model');
var Org             =   require('../../model/Organisation-model');
var Language        =   require('../../model/Language-model');
var Role            =   require('../../model/Role-model');
var App             =   require('../../model/Application-model');
var Permission      =   require('../../model/Permission-model');
var helper          =   require('../setup/helper/db_helper');
var org_helper      =   require('./helper/org_helper');
var db_helper       =   require('../setup/helper/db_helper');
var S               =   require('string');
var async           =   require('async');
var params                  =   ['channel', 'application', 'dbHost',
                                    'dbName',   'dbHostPort',
                                    'languages', 'organisationName'
                                ];

router.post('/create', function(req, res) {
    var data    =   req.body;
    var user    =   data.user;
    async.waterfall([
        function doValidation(next){
            var err =   null;
            async.forEachOf(params, function(param, i, cb){
                err =   err?err:(data[param] !=undefined)?null: '#org.setup.invalid.'+param;
                cb();
            }, function _done(){
                next(err? new Error(err): null);
            });
        },
        function isAuth(next){
            next(null, (data.auth &&  data.auth=== true));
        },
        function doConn(auth, next){
            db_helper.createConn(auth, data,  function(err, conn){
                if(!err && conn){
                    next(null, conn);
                }else{
                    next(new Error(err));
                }
            });
        },
        function doUser(conn, next){
            User.findOne({username:data.username}, function(err, admin){
                if(!err && admin){
                    next(null, admin, conn);
                }else{
                    next(null, null, conn);
                }
            });
        },
        function locateLanguage(admin, conn, next){
            Language.findOne({code:data.languages}, function(err, language){
                if(!err && language){
                    next(null, language, admin, conn);
                }else{
                    next(new Error('#org.create.default_language.invalid'));
                }
            });
        },
        function doOrg(language, admin, conn, next){
            var org =   new Org();
            org.organisationName    =   data.organisationName;
            org.cluster_size        =   data.cluster_size||1;
            org.dbConn              =   conn;
            org.languages.push({language:language, org_default:true});
            org.persist(user, function(err, doc){
                if(!err && doc){
                    next(null, doc, language, admin);
                }else{
                    console.error(err, doc);
                    next(new Error('#org.create.failed'));
                }
            });
        },
        function locatePerms(org, language, admin, next){
            Permission.find({channel: 'PORTAL', system: { $ne: 'YES' }}, function(err, perms){
                next(null, perms, org, language, admin);
            });
        },
        function doRole(perms, org, language, admin, next){
            var role            =    new Role();
            role.name           =    data.organisationName+'_ADMIN';
            role.description    =    data.organisationName+'_ADMIN';
            role.permissions    =    perms;
            role.organizationID =    data.organisationName;
            role.persist(user, function(err, doc){
                if(!err && doc){
                    next(null, doc, perms, org, language, admin);
                }else{
                    next(new Error('#org.create.role.failed'), {org:org});
                }
            });
        },
        function doAdmin(role, perms, org, language, admin, next){
            if(admin){
                console.error('-----admin-----');
                next(null, null, role, perms, org, admin);
            }else{
                var org_admin       =   new User();
                org_admin.msisdn    =   data.adminMsisdn;
                org_admin.firstName =   data.firstName;
                org_admin.lastName  =   data.lastName;
                org_admin.username  =   data.username;
                org_admin.status    =   'ACTIVE';
                org_admin.language  =   language;
                org_admin.roles.push(role);
                org_admin.passwordDetails   =   {
                    hash:    data.adminPassword,
                    status:   'ACTIVE'
                };
                org_admin.persist(user, function(err, doc){
                    if(!err && doc){
                        console.error('__________USER___:', err);
                        next(null, doc, role, perms, org, admin);
                    }else{
                        next(new Error('#org.create.admin.failed'), {org:org, role:role});
                    }
                });
            }
        },
        function doApplication(admin_user, role, perms, org, admin, next){
            console.error('-----app-----');
            var app             =       new App();
            app.name            =       data.application;
            app.code            =       data.application+'_'+data.organisationName;
            app.channel         =       'PORTAL';
            app.description     =       data.organisationName+' Portal';
            app.organizationID  =       data.organisationName;
            app.permissions     =       perms;
            app.persist(user, function(err, doc){
                if(!err && doc){
                    next(null, doc, admin_user, role, perms, org, admin);
                }else{
                    console.error(err);
                    next(new Error('#org.create.application.failed'), {org:org, role:role, user:admin_user});
                }
            });
        },
        function doClean(application, admin_user, role, perms, org, admin, next){
            console.error('-----clean-----');
            if(!admin_user &&admin){
                admin.addRole(user, role, function(err){
                    if(!err){
                        next();
                    }else{
                        next(new Error(err), {org:org, role:role});
                    }
                });
            }else{
                next();
            }
        }
    ],
        function done(err, rollback){
            if(!err){
                res.send({'code': '00', 'message': 'success'});
            }else{
                if(rollback){
                    async.waterfall([
                        function doRollback(cb){
                            async.forEachOf(rollback, function process(param, name, sb){
                                  /*try{
                                      console.error('____>>', JSON.stringify(param));
                                      param.remove(user, {override:true}, function(){
                                          sb();
                                      });
                                  }catch(e){
                                      sb();
                                  }*/
                                sb();
                            }, function __done(){
                                cb();
                            });
                        }
                    ],
                   function _done(){
                       res.send({'code': '06', 'message': err.message});
                   });
                }else{
                    res.send({'code': '06', 'message': err.message});
                }
            }
        });
});
router.post('/user/search', function(req, res) {
    var data            =   req.body;
    var admin           =   data.admin;
    User.findOne({username: admin}, function(err, user){
        if(!err && user){
            res.send({'code': '00', 'message': 'success', data:user});
        }else{
            res.send({'code': '06', 'message': '#user.search.invalid'});
        }
    });
});
router.post('/languages', function(req, res) {
    var data            =   req.body;
    var organizationID  =   data.organizationID;
    Org.findOne({organisationName: organizationID}, function(err, org){
        if(!err && org){
            var response    =   [];
            async.eachSeries(org.languages, function(l, next){
                Language.findOne({_id: l.language}, function(err, lang){
                    if(!err && lang){
                        response.push(lang);
                    }
                    next();
                });
            }, function done(){
                res.send({'code': '00', 'message': 'success', data:response});
            });
        }else{
            res.send({'code': '06', 'message': '#org.list_languages.error'});
        }
    });
});
router.post('/language/add', function(req, res) {
    var data            =   req.body;
    var user            =   data.user;
    var organizationID  =   data.organizationID;
    var languages       =   data.languages||[];
    async.parallel({
        org: function (next){
            Org.findOne({organisationName: organizationID}, function(err, org){
                next(org?err: '#org.langauge.add.ntf', org);
            });
        },
        lang: function(next){
            var langs   =   [];
            async.eachSeries(languages, function(language, cb){
                Language.findOne({_id: language}, function(err, l){
                    if(l){
                        langs.push(l);
                    }
                    cb();
                });
            }, function back(){
                next(null, langs);
            });
        }
    },
        function done(err, result){
            if(!err && result.org && result.lang){
                var org         =   result.org;
                var langs       =   result.lang||[];
                async.eachSeries(langs, function(lang, r){
                    org.addLanguage(lang, user, function(err, doc){
                        r();
                    });
                }, function rs(){
                    res.send({'code': '00', 'message': 'success'});
                });
            }else{
                res.send({code: '06', message: err});
            }
        });
});
router.post('/all', function (req, res) {
    Org.find({system:'NO'}, function(err, orgs){
        if(err){
            res.send({'code': '06', 'message': '#org.message.all.failed'});
        }else{
            res.send({'code': '00', 'message': 'success', data:orgs});
        }
    });
});
router.post('/messages/all', function (req, res) {
    Org.find({}, function(err, orgs){
        res.send({'code': '00', 'message': 'success', data:orgs});
    });
});
router.post('/delete', function (req, res) {
    var session             =   req.body.session;
    var user                =   req.body.user;
    var organizationID      =   req.body.organizationID;
    Org.findOne({system:'NO', override:true, organizationName: organizationID}, function(err, org){
        if(org){
            org.remove(user, function(err){
                res.send({'code': '00', 'message': 'success'});
            });
        }else{
            res.send({'code': '00', 'message': 'success'});
        }
    });
});
router.post('/deleted', function (req, res) {
    Org.find({system:'NO', override:true}, function(err, orgs){
        res.send({'code': '00', 'message': 'success', data:orgs});
    });
});
router.post('/list_all_organisations', bodyParser, function(req, res) {
    var data    =   req.body;
    var session =   data.session;
    Org.findOne({organisationName: session.organizationID}, function(err, org){
        if(!err && org){
            if(org.system === 'YES'){
                Org.find({system:"NO"}, function(err, all_org){
                    if(err&&!all_org){
                        res.json({code:'06', message:'#Org.list.not.found',data:err});
                    }else {
                        res.json({code: '00', message: 'success', data: all_org});
                    }
                });
            }else{
                res.json({code:'09', message: 'not implemented yet'});
            }
        }else{
            res.json({code:'06', message:'#Org.list.notallowed'});
        }
    });
});
router.post('/list_all_organisations', bodyParser, function(req, res) {
    var data    =   req.body;
    var session =   data.session;
    Org.findOne({organisationName: session.organizationID}, function(err, org){
        if(!err && org){
            if(org.system === 'YES'){
                Org.find({system:"NO"}, function(err, all_org){
                    if(err&&!all_org){
                        res.json({code:'06', message:'#Org.list.not.found',data:err});
                    }else {
                        res.json({code: '00', message: 'success', data: all_org});
                    }
                });
            }else{
                res.json({code:'09', message: 'not implemented yet'});
            }
        }else{
            res.json({code:'06', message:'#Org.list.notallowed'});
        }
    });
});
router.post('/list_all_organisations', bodyParser, function(req, res) {
    var data    =   req.body;
    var session =   data.session;
    Org.findOne({organisationName: session.organizationID}, function(err, org){
        if(!err && org){
            if(org.system === 'YES'){
                Org.find({system:"NO"}, function(err, all_org){
                    if(err&&!all_org){
                        res.json({code:'06', message:'#Org.list.not.found',data:err});
                    }else {
                        res.json({code: '00', message: 'success', data: all_org});
                    }
                });
            }else{
                res.json({code:'09', message: 'not implemented yet'});
            }
        }else{
            res.json({code:'06', message:'#Org.list.notallowed'});
        }
    });
});
router.post('/list_all_organisations', bodyParser, function(req, res) {
    var data    =   req.body;
    var session =   data.session;
    Org.findOne({organisationName: session.organizationID}, function(err, org){
        if(!err && org){
            if(org.system === 'YES'){
                Org.find({system:"NO"}, function(err, all_org){
                    if(err&&!all_org){
                        res.json({code:'06', message:'#Org.list.not.found',data:err});
                    }else {
                        res.json({code: '00', message: 'success', data: all_org});
                    }
                });
            }else{
                res.json({code:'09', message: 'not implemented yet'});
            }
        }else{
            res.json({code:'06', message:'#Org.list.notallowed'});
        }
    });
});
handler.use('/org', router);
module.exports      =   handler;
