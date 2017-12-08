
var express         =   require('express');
var router          =   express.Router();
var handler         =   express();
var logger          =   require('util');
var bodyParser      =   require('body-parser').json();
var User            =   require('../../model/User-model');
var Language        =   require('../../model/Language-model');
var helper             =   require('./../../application/context/tran_handler/helper/query_helper');
var audit_helper       =   require('./../../application/portal/helper/auditHelper');
var Org             =   require('../../model/Organisation-model');
var Role            =   require('../../model/Role-model');
var shortid            =   require('shortid');
var AuthDetail      =   require('../../model/AuthDetail-model');
var service         =   require('../../engine/HashService');
var user_helper     =   require('./helper/user_helper');
var configurations  =   require('../../engine/ConfigService');
var config  =  new configurations();
var Notification       =   require('../../model/Notification-model');
var S                  =   require('string');
var passwordSheriff    =   require('password-sheriff');
var PasswordPolicy     =   passwordSheriff.PasswordPolicy;
var async              =   require('async');
var Chance             =   require('chance');
var chance             =   new Chance();
var randomize = require('randomatic');
var moment = require('moment');
var charsets = passwordSheriff.charsets;

router.post('/create', bodyParser, function(req, res) {
    var data    =   req.body;
    var admin   =   data.user;

    user_helper.validateCreateRequest(data, function(err){
        if(err){
           res.send({code:'06', message:err});
        }else {
            user_helper.createUser(data, admin, function (err, user) {
                if (!err && user) {
                    var auth = AuthDetail();
                    auth.user = user._id;
                    auth.channel = data.user_channel;
                    auth.uuid = data.username;
                    auth.organizationID = data.organizationID;
                    auth.status = 'ACTIVE';
                    auth.device = {
                        deviceId: data.deviceId || data.username,
                        platform: data.user_channel
                    };

                    res.send({code: '00', message: 'success', data: user});
                } else {
                    res.send({code: '06', message: err});
                }
            });
        }
    });
});
router.post('/list_user', bodyParser, function(req, res) {
    var data    =   req.body;
    var session =   data.session;
    async.waterfall([
            function doQuery(next) {
                Org.findOne({organisationName: session.organizationID}, function(err, org){
                    if(!err && org){
                        AuditUserDetail.find({}, function(err, users){
                            var extras = [];
                            if(!err && users){
                                async.forEachOf(users, function (user, i, sb){
                                    if(user.status==='PENDING' &&user.new_details &&user.new_details.channel==='PORTAL' && !user.old_details &&!user.parent){
                                        extras.push(user);
                                    }
                                    sb();
                                }, function close(){
                                    next(null, extras);
                                });
                            }else {
                                next('users.data.ntf',null);
                            }
                        });
                    }else{
                        next('#user.list.notallowed',null);
                    }
                });
            },
            function doroles(query, next) {
                if(query.length>0){
                    async.forEachOf(query, function (user, i, sb){
                        var roleResult = '';
                        Role.find({_id:{$in:user.new_details.roles}}, function(err, result){
                            if(!err && result){
                                async.forEachOf(result, function (role, i, cb){
                                        roleResult+='<span style="font-weight: bold">'+role.name+'</span><br>';
                                        cb();
                                    },
                                    function close() {
                                        user.new_details.roles = roleResult;
                                        sb();
                                    });
                            }else {
                                sb();
                            }
                        });
                    }, function close(){
                        next(null, query);
                    });
                }else {
                    next(null, query);
                }
            }
        ],
        function done(err, users) {
            if (!err) {
                var result = {code: '00', message: 'success',data: {users: users}};
                res.send(result);
            } else {
                res.send({code: '06', message: err, data: {}});
            }
        });
});
router.post('/create_user', bodyParser, function(req, res) {
    var data    =   req.body;
    delete data.session;
    delete data.application;
    var user    =   data.user;
    User.findOne({msisdn:data.msisdn}, function (err, audit_user) {
        if(!err && !audit_user){
            var audit = new AuditUserDetail();
            audit.query = {msisdn:data.msisdn};
            audit.new_details = data;
            audit.msisdn = data.msisdn;
            audit.email  = data.email;
            audit.persist(user, function (error, audit_data) {
                if(!err && audit_data){
                    res.send({code:'00', message:'success', data:audit_data});
                }else {
                    res.send({code:'00', message:'audit.user.create.fail'+error});
                }
            });
        }else {
            res.send({code:'06', message:'user.create.fail.user.already.exist'+err});
        }
    });
});
router.post('/process_user', bodyParser, function(req, res) {
    var data    =   req.body;
    var admin   =   data.user;
    async.waterfall([
            function doValidate(next) {
                user_helper.validateCreateRequest(data, function (err) {
                    if (err) {
                            next({code: '06', message: err}, null);
                    } else {
                        next(null, data);
                    }
                });
            },
            function doPassword(payload, next) {
                var password = randomize('A', 1)+randomize('a', 4)+ randomize('0', 2)+'!';
                data['successText'] ='Welcome Parts Portal. Your Password is '+password+', please change immediatley.If you did not make this request,contact Autoboys at +2710 600 7900.';
                next(null, password , payload);
            },
            function doSecurity(password, payload, next) {
                config.locate("PASSWORDRULES_"+payload.channel,function(err,info) {
                    var expressionsArr = [];
                    Object.keys(info.value).forEach(function (key,index) {
                        if(info.value[key])
                        {
                            switch (key)
                            {
                                case "digits":
                                    expressionsArr.push(charsets.numbers);
                                    break;
                                case "lowercase":
                                    expressionsArr.push(charsets.lowerCase);
                                    break;
                                case "uppercase":
                                    expressionsArr.push(charsets.upperCase);
                                    break;
                                case "symbols":
                                    expressionsArr.push(charsets.specialCharacters);
                                    break;

                            }

                        }
                    })
                    var policy = new PasswordPolicy({
                        length : {
                            minLength : info.value.length
                        },
                        containsAtLeast : {
                            atLeast : info.value.atLeast,
                            expressions : expressionsArr
                        }
                    });
                    if(policy.check(password))
                    {
                        service.encrypt(password, function (err, hash) {
                            if (!err && hash) {
                                data['password'] = {
                                    hash:hash
                                };
                                next(null, payload);
                            } else {
                                next(err, null);
                            }
                        })
                    }else
                    {
                        next("Password not valid", null);
                    }
                });
            },
            function getLanguage(payload, next){
                Language.findOne({system_default:true}, function(err, language_doc){
                    if(!err && language_doc){
                        payload['language'] = language_doc._id;
                        next(null, payload);
                    }else{
                        next(null, payload);
                    }
                })
            },
            function doCreateUser(payload, next) {
                    user_helper.createUser(payload, admin, function(err, user){
                        if(!err && user){
                            next(null, user , payload);
                        }else{
                            next(err, null);
                        }
                    });
            },
            function DoAuth( user, payload, next) {
                    var expiry_date = new Date();
                    expiry_date.setDate(expiry_date.getDate() + 30);
                    var auth = AuthDetail();
                    auth.user = user._id;
                    auth.channel = payload.channel;
                    auth.uuid = payload.username;
                    auth.organizationID = payload.organizationID;
                    auth.status = 'REISSUE';
                    auth.device = {
                        deviceId :  payload.deviceId||payload.username,
                        platform : payload.channel
                    };
                    auth.hash = data.password.hash;
                    auth.expiry_date = expiry_date;
                    auth.persist(admin, function (error, auth_data) {
                        if(!error && auth_data){
                            var successMessge        =    new Notification();
                            successMessge.message    =   data.successText;
                            successMessge.server_ref    =   chance.zip(); /// this is for testing
                            successMessge.type       =   'SMS';
                            successMessge.owner      =   user._id;
                            successMessge.msisdn     =   payload.msisdn;
                            successMessge.save(function (err, data) {
                            });
                            next(null, user);
                        }else {
                            next(error, null);
                        }
                    });
            }],
        function done(err, result) {
            if(!err) {
                res.send({code: '00', message: 'success',data: result});
            }else {
                res.send({code: '06', message: err,data:{}});
            }
        });
});
router.post('/list', bodyParser, function(req, res) {
    var data    =   req.body;
    var session =   data.session;
    Org.findOne({organisationName: session.organizationID}, function(err, org){
        if(!err && org){
            if(org.system === 'YES'){
                User.find({}, function(err, users){
                    res.send({code:'00', message: 'success', data: users});
                });
            }else{
                res.send({code:'09', message: 'not implemented yet'});
            }
        }else{
            res.send({code:'06', message:'#user.list.notallowed'});
        }
    });
});
router.post('/search', bodyParser, function(req, res) {
    var data    =   req.body;
    var session =   data.session;
    var str =   JSON.stringify(data.search);
    str     =   S(str).replaceAll('@','.').s;
    str     =   S(str).replaceAll('#','$').s;
    str     =   S(str).replaceAll('&','#').s;
    //console.log('QUERY     1:  ', str);
    try{
        data.search =  JSON.parse(str);
    }catch(e){
        console.log('query already an object');
    }
    Org.findOne({organisationName: session.organizationID}, function(err, org){
        if(!err && org){
            User.find(data.search, function(err, users){
                res.send({code:'00', message: 'success', data: users});
            });
        }else{
            res.send({code:'06', message:'#user.list.notallowed'});
        }
    });

});
router.post('/request', function(req, res){
    var payload = req.body;
    var user = {_id:payload.updated_by};
    async.waterfall([
            function doQuery(next) {
                if(payload.query){
                    helper.prepare(payload.query, function (err, query) {
                        next(err, query);
                    });
                }else{
                    next('#model_updater.query.invalid',null);
                }
            },
            function doOldDetails(query , next) {
                User.findOne(query, function (err,data) {
                    if(!err && data){
                        next(null, data._id, data);
                    }else {
                       next('unable to process update request1', null);
                    }
                })
            },
            function prepareDetails(id, old_details, next) {
                if(old_details){
                    audit_helper.prepareUpdate(old_details, payload.new_details, function (err, data) {
                        next(err, data, id);
                    })
                }else {
                    next('#model_updater.record.not.found',null);
                }
            },
            function saveUpdateRequest(data, id, next) {
                var audit = new AuditUserDetail();
                audit.updating = id;
                audit.old_details = data.old_data;
                audit.new_details = data.new_data;
                audit.query     = payload.query;
                audit.msisdn    = payload.msisdn;
                audit.persist(user, function (error, record) {
                    if (!error && record) {
                        next(null, record);
                    } else {
                       next('unable to process update request2', null);
                    }
                })
            }
        ],
        function done(err, result) {
            if(!err) {
                res.send({code: '00', message: 'success',data: result});
            }else {
                res.send({code: '06', message: err,data:{}});
            }
        });
});
router.post('/list_pending', function(req, res){
    var data    =   req.body;
    var session =   data.session;
    async.waterfall([
            function doQuery(next) {
                Org.findOne({organisationName: session.organizationID}, function(err, org){
                    if(!err && org){
                        AuditUserDetail.find({}, function(err, users){
                            var extras = [];
                            if(!err && users){
                                async.forEachOf(users, function (user, i, sb){
                                    if(user.status==='PENDING' && user.old_details && user.old_details!=null){
                                        extras.push(user);
                                    }
                                    sb();
                                }, function close(){
                                    next(null, extras);
                                });
                            }else {
                                next('users.pending.data.ntf',null);
                            }
                        });
                    }else{
                        next('#user.list.notallowed',null);
                    }
                });
            },
            function doroles(query, next) {
                if(query.length>0){
                    async.forEachOf(query, function (user, i, sb){
                        var roleResult = '';
                        Role.find({_id:{$in:user.new_details.roles}}, function(err, result){
                            if(!err && result){
                                async.forEachOf(result, function (role, i, cb){
                                        roleResult+='<span style="font-weight: bold">'+role.name+'</span><br>';
                                        cb();
                                    },
                                    function close() {
                                        user.new_details.roles = roleResult;
                                        sb();
                                    });
                            }else {
                                sb();
                            }
                        });
                    }, function close(){
                        next(null, query);
                    });
                }else {
                    next(null, query);
                }
            },
            function dorolesOld(query, next) {
                if(query.length>0){
                    async.forEachOf(query, function (user, i, sb){
                        var roleResult = '';
                        Role.find({_id:{$in:user.old_details.roles}}, function(err, result){
                            if(!err && result){
                                async.forEachOf(result, function (role, i, cb){
                                        roleResult+='<span style="font-weight: bold">'+role.name+'</span><br>';
                                        cb();
                                    },
                                    function close() {
                                        user.old_details.roles = roleResult;
                                        sb();
                                    });
                            }else {
                                sb();
                            }
                        });
                    }, function close(){
                        next(null, query);
                    });
                }else {
                    next(null, query);
                }
            },
            function map_data(query, next) {
                if(query.length>0){
                    var extras = [];
                    async.forEachOf(query, function (user, i, sb){
                            var new_details = [];
                            async.forEachOf(user.new_details, function (value, key, cb) {
                                if(key==='hash') {
                                    new_details.push({
                                        key: key,
                                        new_value: '****',
                                        old_value: '****',
                                        show_button:!new_details[0].show_button||true
                                    });
                                }else if(key==='msisdnHistory') {
                                    var temp ={
                                        date: moment(value["0"].date).format('YYYY/MM/DD HH:mm:ss'),
                                        current_msisdn:value["0"].current_msisdn,
                                        previous_msisdn:value["0"].previous_msisdn
                                    }
                                    new_details.push({
                                        key: key,
                                        new_value: temp,
                                        old_value: user.old_details[key],
                                        show_button:!new_details[0].show_button||true
                                    });
                                }else if(key!='_id') {
                                    new_details.push({
                                        key: key,
                                        new_value: value,
                                        old_value: user.old_details[key],
                                        show_button:new_details[0].show_button||true
                                    });
                                }
                                cb();
                            }, function close() {
                                user.new_details =new_details;
                                extras.push(user);
                                sb();
                            });
                    }, function close(){
                        next(null, extras);
                    });
                }else {
                    next(null, query);
                }
            }
        ],
        function done(err, users) {
            if (!err) {
                var result = {code: '00', message: 'success',data: {users: users}};
                res.send(result);
            } else {
                console.log('Error', err);
                res.send({code: '06', message: err, data: {}});
            }
        });
});
router.post('/process_update', function(req, res){
    var payload1 = req.body;
    var payload = {};
    var password = '';
    async.waterfall([
            function doPendingUPdate(next) {
                AuditUserDetail.findOne({_id:payload1.id}, function (err, update) {
                    if(!err && update && update.old_details) {
                        payload['query'] = update.query;
                        payload['channel'] = payload1.channel;
                        payload['msisdn'] = update.msisdn;
                        var user = {_id:payload1.supervisor};
                        next(null, user ,update);
                    }else {
                        next('audit.data.ntf', null);
                    }
                })
            },
            function doUpdate(user, update, next) {
                if(payload1.status.toUpperCase()==='APPROVED'){
                    User.findOne(payload.query,function(err,data){
                        if(!err && data){
                            async.forEachOf(update.new_details, function(value, key, cb){
                                var n= key.indexOf("$");
                                if (n>0) {
                                    key1 = key.substring(0,n);
                                    key2 = key.substring(n+1);
                                    var temp = data[key1];
                                    temp[key2] = value;
                                    data[key1] = temp;
                                }
                                else {
                                    try
                                    {
                                        data[key] = JSON.parse(value);
                                    }catch (e)
                                    {
                                        data[key] = value;
                                    }
                                }

                                cb()
                            },function done(){
                                data.persist(user, function (err, data) {
                                    if(!err)
                                    {
                                        next(err, data, user);
                                    }else
                                    {
                                        next(err,null);
                                    }
                                });
                            })
                        }else{
                            next(err);
                        }
                    });
                }else {
                    next(null, 'auth', user);
                }
            },
            function doUUID(UpdateModel, user, next) {
                AuthDetail.findOne({channel:'PORTAL',user:UpdateModel._id},function(err,data){})
            },
            function DoUpdate(UpdateModel, user, next) {
                AuditUserDetail.findOne({_id:payload1.id}, function (err,data) {
                    if(!err && data){

                        data.status = payload1.status;
                        data.persist(user, function (error, record) {
                            if(!error && record){
                                next(null, record);
                            }else {
                                next('unable to process update request3', null);
                            }
                        })
                    }else {
                        next('unable to process update request4', null);
                    }
                })
            }],
        function done(err, result) {
            if(!err) {
                res.send({code: '00', message: 'success',data: result});
            }else {
                res.send({code: '06', message: err,data:{}});
            }
        });
});
router.post('/addroles', bodyParser, function(req, res) {
    var data        =   req.body;
    var user_id     =   data.user_id;
    var roles       =   data.roles;
    var user        =   data.user;
    var session     =   data.session;
    Org.findOne({organisationName: session.organizationID, system:'YES'}, function(err, org){
        if(!err && org){
            User.findOne({_id: user_id}, function(err, cuser){
                if(!err && cuser){
                    if(roles && roles.length){
                        cuser.roles = roles;
                    }
                    cuser.persist(user, function(err, doc){
                        if(!err){
                            res.send({code:'00', message: 'success', data: doc});
                        }else{
                            res.send({code:'06', message:'#user.addroles.failed'});
                        }
                    });
                }else{
                    res.send({code:'06', message:'#user.addroles.user.invalid'});
                }
            });
        }else{
            res.send({code:'06', message:'#user.addroles.notallowed'});
        }
    });
});
function getUsername(id) {
    User.findOne({_id:id}, function (err, updatedBy) {
        if(!err && updatedBy){
            return updatedBy.firstName +' '+ updatedBy.lastName;
        }
    });
}
handler.use('/user', router);
module.exports = handler;
