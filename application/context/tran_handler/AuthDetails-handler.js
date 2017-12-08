
var async = require('async');
var Chance = require('chance');
var moment = require('moment');
var S = require('string');
var TranHandler = require('./TranHandler');
var User = require('../../../model/User-model');
var Role = require('../../../model/Role-model');
var Session = require('../../../model/Session-model');
var AuthDetail = require('../../../model/AuthDetail-model');
var Application = require('../../../model/Application-model');
var Org = require('../../../model/Organisation-model');
var helper = require('../../../engine/HashService');
var serverHelper = require('./helper/serverHelper');
var helper_query             =   require('./../../../application/context/tran_handler/helper/query_helper');
var audit_helper       =   require('./../../../application/context/tran_handler/helper/auditHelper');
var AuditAuthDetail    =   require('../../../model/AuthDetailAudit-model');
var configurations     =   require('../../../engine/ConfigService');
var config             =   new configurations();
var passwordSheriff    =   require('password-sheriff');
var shortid            =   require('shortid');
var PasswordPolicy     =   passwordSheriff.PasswordPolicy;
var logger             =   require('util');
var randomize          = require('randomatic');
var _                  = require('lodash');
var charsets           =   passwordSheriff.charsets;
var handler = new TranHandler();
var chance = new Chance();

handler.processStep = function (uri, headers, action, payload, callback) {
    action = payload.action;

    switch (action) {
        case 'LOGIN':
            async.waterfall([
                    function doSession(next) {
                        Session.findOne({_id: payload.session}, function (err, session) {
                            if (!err && session) {
                                next(null, session);
                            } else {
                                next('#auth_handler.session.invalid');
                            }
                        });
                    },
                    function doAuth(session, next) {
                        var query = {channel: session.channel, uuid: payload.uuid, organizationID: session.organizationID};
                        if (session.channel === "INTERNET_BANKING") {
                            query = {channel: "OTP", uuid: payload.uuid, organizationID: session.organizationID};
                            AuthDetail.findOne(query, function (err, auth) {
                                if (!err && auth) {
                                    helper.compare(payload.otp, auth.hash, function (err, isMatch) {
                                        if (!err && isMatch === true) {
                                            query = {
                                                channel: session.channel,
                                                uuid: payload.uuid,
                                                organizationID: session.organizationID
                                            };
                                            AuthDetail.findOne(query, function (err, auth) {
                                                if (!err && auth) {
                                                    next(null, auth, session);
                                                } else {
                                                    next('#auth_handler.authdetails.invalid');
                                                }
                                            });
                                        } else {
                                            next('#auth_handler.credentials.invalid3');
                                        }
                                    })
                                } else {
                                    next('#auth_handler.authdetail.ntf');
                                }
                            });
                        } else if (session.channel === "PORTAL") {
                           AuthDetail.findOne(query, function (err, auth) {
                                if (!err && auth) {
                                    next(null, auth, session);
                                } else {
                                    next('#auth_handler.credentials.invalid4');
                                }
                            });
                        } else if (session.channel === "WEBSERVICE") {
                           AuthDetail.findOne(query, function (err, auth) {
                                if (!err && auth) {
                                    next(null, auth, session);
                                } else {
                                    next('#auth_handler.credentials.invalid5');
                                }
                            });
                        } else if (session.channel === "APP") {
                            if (action === "LOGIN") {
                                AuthDetail.findOne(query, function (err, auth) {
                                    if (!err && auth) {
                                        next(null, auth, session);
                                    } else {
                                        next('#auth_handler.credentials.invalid6');
                                    }
                                });

                            } else if (action === "OTP-CHECK") {

                                query = {channel: "OTP", uuid: payload.uuid, organizationID: session.organizationID};
                                AuthDetail.findOne(query, function (err, auth) {
                                    if (!err && auth) {

                                        helper.compare(payload.otp, auth.hash, function (err, isMatch) {
                                            if (!err && isMatch === true) {
                                                next(null, auth, session);

                                            } else {
                                                next('#auth_handler.credentials.invalid1');
                                            }
                                        })
                                    } else {
                                        next('#auth_handler.authdetail.ntf');
                                    }
                                });
                            }
                        }
                        else if (session.channel === "USSD") {
                           if (action === "LOGIN") {
                                AuthDetail.findOne(query, function (err, auth) {
                                    if (!err && auth) {
                                        next(null, auth, session);
                                    } else {
                                        next('#auth_handler.credentials.invalid6');
                                    }
                                });

                            } else if (action === "OTP-CHECK") {

                                query = {channel: "OTP", uuid: payload.uuid, organizationID: session.organizationID};
                                AuthDetail.findOne(query, function (err, auth) {
                                    if (!err && auth) {

                                        helper.compare(payload.otp, auth.hash, function (err, isMatch) {
                                            if (!err && isMatch === true) {
                                                next(null, auth, session);

                                            } else {
                                                next('#auth_handler.credentials.invalid1');
                                            }
                                        })
                                    } else {
                                        next('#auth_handler.authdetail.ntf');
                                    }
                                });
                            }
                        } else {
                            AuthDetail.findOne(query, function (err, auth) {
                                if (!err && auth) {
                                    next(null, auth, session);
                                } else {
                                    next('#auth_handler.credentials.invalid2');
                                }
                            });
                        }
                    },
                    function doUser(auth, session, next) {
                        User.findOne({_id: auth.user}, function (err, user) {
                            if (!err && user) {
                                next(null, user, auth, session);
                            } else {
                                next('#auth_handler.user.invalid');
                            }
                        })
                    },
                    function doOrg(user, auth, session, next) {
                        Org.findOne({organisationName: session.organizationID}, function (err, org) {
                            if (!err && org) {
                                next(null, org, user, auth, session);
                            } else {
                                next('#auth_handler.org.invalid');
                            }
                        });
                    },
                    function doApplication(org, user, auth, session, next) {
                        Application.findOne({_id: session.application}, function (err, application) {
                            if (!err && application) {
                                next(null, application, org, user, auth, session);
                            } else {
                                next('#auth_handler.application.invalid');
                            }
                        });
                    },
                    function doValidate(application, org, user, auth, session, next) {
                        if (user.status === 'ACTIVE' || user.status === 'NEW' || user.status === 'REISSUE') {
                            if (auth.channel === 'APP') {
                                var device = auth.device;
                                if (device && device.deviceId === auth.uuid) {
                                    if (device.status === 'ACTIVE') {
                                        next(null, org, application, user, auth, session);
                                    } else {
                                        next('#auth_handler.device.status.' + device.status);
                                    }
                                } else {
                                    next('#auth_handler.auth.device.corrupt');
                                }
                            } else {
                                next(null, org, application, user, auth, session);
                            }
                        } else {
                            next('#auth_handler.user.status.' + user.status);
                        }
                    },
                    function doHash(org, application, user, auth, session, next) {
                        if (action === "APP-REG") {
                            next(null, {code: '00', message: 'success'});
                        }
                        if (action === "OTP-CHECK") {
                            next(null, {code: '00', message: 'success'});
                        }
                        else {
                            if (payload.useServerWebservice) {
                                 serverHelper.comparePasswords(payload.username, payload.password, function (err, matches) {
                                    if (matches && err === "00") {
                                        if (auth.status === 'NEW' || auth.status === 'REISSUE') {
                                            var result = {
                                                code: '06',
                                                message: '#auth_handler.auth.status.' + auth.status,
                                                data: {}
                                            };
                                            next(err, result);
                                        } else {
                                            auth.resetAttempts(user, function () {
                                                session.linkUser(user, application, org, function (err, permissions) {
                                                    var result = {
                                                        code: '00',
                                                        message: 'success',
                                                        data: {user: user, permissions: permissions}
                                                    };
                                                    next(err, result);
                                                });
                                            });
                                        }
                                    } else {
                                        auth.incrementAttempts(user, function () {
                                            var result = {code: '06', message: '#auth_handler.password.invalid', data: {}};
                                            next(err, result);
                                        });
                                    }
                                })
                            } else {
                                helper.compare(payload.password, auth.hash, function (err, isMatch) {
                                    if (!err && isMatch === true) {
                                       if (auth.status === 'NEW' || auth.status === 'REISSUE') {
                                            var result = {
                                                code: '06',
                                                message: '#auth_handler.auth.status.' + auth.status,
                                                data: {}
                                            };
                                            next(err, result);
                                        } else {
                                            auth.resetAttempts(user, function () {
                                                session.linkUser(user, application, org, function (err, permissions) {
                                                    var result = {
                                                        code: '00',
                                                        message: 'success',
                                                        data: {user: user, permissions: permissions}
                                                    };
                                                    next(err, result);
                                                });
                                            });
                                        }
                                    } else {
                                        if (isMatch === false) {
                                            auth.incrementAttempts(user, function () {
                                                var result = {code: '06', message: '#auth_handler.password.invalid', data: {}};
                                                next(err, result);
                                            });
                                        } else {
                                            auth.incrementAttempts(user, function () {
                                                var result = {code: '06', message: '#auth_handler.action.failed', data: {}};
                                                next(err, result);
                                            });
                                        }
                                    }
                                });
                            }

                        }

                    }
                ],
                function done(err, result) {
                    if (!err && result) {
                        callback(null, result);
                    } else {
                        callback(err);
                    }
                });
            break;
        case 'update':
            async.waterfall([
                    function findAuthDetails(next) {
                        if (!payload.user_id) {
                            next('payload.user_id.undefined', null);
                        }
                        if (!payload.msisdn) {
                            next('#no.need.to.update.authDetails', null);
                        }

                        AuthDetail.find({
                            user: payload.user_id
                        }, function (err, authDetailsDoc) {
                            if (!err && authDetailsDoc) {
                                next(null, authDetailsDoc);
                            } else {
                                if (err) {
                                    next(err, null);
                                } else {
                                    next('#authDetails.ntf', null);
                                }
                            }
                        });
                    },
                    function prepareAuthDetails(authDetails, next) {

                        var newAuthDetails = [];
                        async.forEachSeries(authDetails, function (authDetail, nextRecord) {
                            if (authDetail.channel === 'OTP' || authDetail.channel === 'USSD' || authDetail.channel === 'INTERNET_BANKING') {
                                if (payload.updatedBy) {
                                    authDetail.updatedBy = payload.updatedBy;
                                    authDetail.updated = new Date();
                                }
                                if (payload.msisdn) {
                                    authDetail.uuid = payload.msisdn;
                                    //var deviceRecord = {previous_deviceId: authDetail.deviceId, current_deviceId: payload.msisdn, updatedBy: payload.updatedBy, date: new Date()};
                                    //authDetail.device_history.push(deviceRecord);
                                }
                                newAuthDetails.push(authDetail);
                            }
                            nextRecord();
                        }, function done() {
                            next(null, newAuthDetails);
                        });
                    }
                ],
                function done(err, result) {
                    if (!err && result) {
                        callback(null, {code: '00', message: 'success', data: result});
                    } else {
                       callback({code: '06', message: err});
                    }
                });
            break;
        case 'request_reissue':
            var user = {_id:payload.updated_by};
            async.waterfall([
                    function doQuery(next) {
                        if(payload.query){
                            helper_query.prepare(payload.query, function (err, query) {
                                next(err, query);
                            });
                        }else{
                            next('#model_updater.query.invalid',null);
                        }
                    },
                    function doOldDetails(query , next) {
                        AuthDetail.findOne(query, function (err,data) {
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
                        var audit = new AuditAuthDetail();
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
                        callback({code: '00', message: 'success',data: result});
                    }else {
                        callback({code: '06', message: err,data:{}});
                    }
                });
            break;
        case 'process_reissue':
            var payload1 = payload;
            var password = '';
            async.waterfall([
                    function doPendingUPdate(next) {
                        AuditAuthDetail.findOne({_id:payload1.id}, function (err, update) {
                            if(!err && update) {
                                payload['query'] = update.query;
                                payload['channel'] = update.query.channel;
                                payload['msisdn'] = update.msisdn;
                                var user = {_id:payload1.supervisor};
                                next(null, user);
                            }else {
                                next('audit.data.ntf', null);
                            }
                        })
                    },
                    function doPassword(user, next) {
                        if(payload.channel==='USSD'){
                            password = randomize('0', 4);
                            payload['password'] = password;
                            next(null, password, user);
                        }else {
                            password = randomize('A', 2)+randomize('a', 2)+ randomize('0', 2)+'!';
                            payload['password'] = password;
                            next(null, password, user);
                        }
                    },
                    function doSecurity(password, user, next) {
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
                                        payload['update'] = {
                                            hash:hash,
                                            status:payload1.pinStatus
                                        };
                                        next(null, user);
                                    } else {
                                        next(err);
                                    }
                                })
                            }else
                            {
                                next("Password not valid");
                            }
                        });
                    },
                    function doUpdateAuth(user, next) {
                        if(payload1.status.toUpperCase()==='APPROVED'){
                            AuthDetail.findOne(payload.query,function(err,data){
                                if(!err && data){
                                    if(data.channel=='PORTAL'){
                                        data.auth_history.push({hash:data.hash,date:moment().format("YYYY-MM-DD HH:mm")})
                                    }
                                    async.forEachOf(payload.update, function(value, key, cb){
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
                    function DoUpdate(UpdateModel, user, next) {
                        AuditAuthDetail.findOne({_id:payload1.id}, function (err,data) {
                            if(!err && data){

                                data.status = payload1.status;
                                data.persist(user, function (error, record) {
                                    if(!error && record){
                                        next(null, {msisdn:payload.msisdn, pin:payload.password,channel:payload.channel});
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
                        callback({code: '00', message: 'success',data: result});
                    }else {
                       callback({code: '06', message: err,data:{}});
                    }
                });
            break;
        case 'process_update':
            async.waterfall([
                    function doPendingUPdate(next) {
                        AuditAuthDetail.findOne({_id:payload.id}, function (err, update) {
                            if(!err && update) {
                                payload['query'] = update.query;
                                payload['channel'] = update.query.channel;
                                payload['msisdn'] = update.msisdn;
                                next(null, update.new_details);
                            }else {
                                next('audit.data.ntf', null);
                            }
                        })
                    },
                    function doUpdateAuth(auth, next) {
                        if(payload1.status.toUpperCase()==='APPROVED'){
                            AuthDetail.findOne(payload.query,function(err,data){
                                if(!err && data){
                                    async.forEachOf(auth, function(value, key, cb){
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
                                        data.persist(payload.user, function (err, data) {
                                            if(!err)
                                            {
                                                next(err, data);
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
                            next(null, 'auth');
                        }
                    },
                    function DoUpdate(UpdateModel, next) {
                        AuditAuthDetail.findOne({_id:payload.id}, function (err,data) {
                            if(!err && data){
                                data.status = payload.status;
                                data.persist(payload.user, function (error, record) {
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
                        callback({code: '00', message: 'success',data: result});
                    }else {
                        callback({code: '06', message: err});
                    }
                });
            break;
        case 'block_channel':
            async.waterfall([
                    function findUser(next) {
                    User.findOne({msisdn:payload.msisdn}, function (err, user) {
                        if (!err && user) {
                            next(null, user);
                        }
                        else {
                            if (err) {
                                next(err, null);
                            } else {
                                next('#auth.ntf', null);
                            }
                        }
                    });
                },
                    function findAuth(user, next) {
                        AuthDetail.find({user:user._id}, function (err, authDoc) {
                            if (!err && authDoc) {
                                next(null, authDoc, user);
                            }
                            else {
                                if (err) {
                                    next(err, null);
                                } else {
                                    next('#auth.ntf', null);
                                }
                            }
                        });
                    },
                    function blockAuth(auth, user, next) {
                        var blocked_auth = [];
                        async.forEachOf(auth, function (authData, i, sb) {
                            if(payload.channel==='ALL' && authData.channel!='OTP'){
                                authData.status = 'BLOCKED';
                                blocked_auth.push(authData);
                            }else if(payload.channel===authData.channel){
                                authData.status = 'BLOCKED';
                                blocked_auth.push(authData);
                            }
                            sb();
                        }, function close() {
                            next(null ,blocked_auth, user);
                        });
                    },
                    function get_old_details(auth, user, next) {
                        var  data = [];
                        async.forEachOf(auth, function (authData, i, sb) {
                            AuthDetail.findOne({user:user._id,channel:authData.channel}, function (err, authDoc) {
                                if (!err && authDoc) {
                                    data.push({new:authData, old:authDoc})
                                    sb();
                                }
                            });
                        }, function close() {
                            next(null ,data, user);
                        });
                    },
                    function saveUpdateRequest( auth, user , next) {
                        async.forEachOf(auth, function (authData, i, sb) {
                            var audit = new AuditAuthDetail();
                            audit.updating = user._id;
                            audit.old_details = authData.old;
                            audit.new_details = {status:authData.new.status};
                            audit.query = {user:user._id,channel:payload.channel};
                            audit.msisdn = payload.msisdn;
                            audit.persist(payload.user, function (error, record) {
                                if (!error && record) {
                                    sb();
                                } else {
                                     next('unable to process update request2', null);
                                }
                                sb();
                            });
                        }, function close() {
                            next(null , user);
                        });
                    }
                ],
                function done(err, result) {
                    if (!err && result) {
                        callback(null, {code: '00', message: 'success', data: result});
                    } else {
                       callback({code: '06', message: err});
                    }
                });
            break;
        case 'list_channel':
            async.waterfall([
                    function findUser(next) {
                        User.findOne({msisdn:payload.msisdn}, function (err, authDoc) {
                            if (!err && authDoc) {
                                next(null, authDoc);
                            }
                            else {
                                if (err) {
                                    next(err, null);
                                } else {
                                    next('#auth.user.ntf', null);
                                }
                            }
                        });
                    },
                    function findAuth(user ,next) {
                        AuthDetail.find({user:user._id}, function (err, authDoc) {
                            if (!err && authDoc) {
                                next(null, authDoc);
                            }
                            else {
                                if (err) {
                                    next(err, null);
                                } else {
                                    next(null,[]);
                                }
                            }
                        });
                    },
                    function doChannel(user ,next) {
                        var channels = [{name:'APP', description:'Mobile Application'},{name:'INTERNET_BANKING', description:'Internet Banking'},{name:'USSD', description:'USSD'}];
                        var addChannels = [];
                        var reissueChannels = [];
                        async.forEachOf(channels, function (channel, i, sb) {
                            var found = _.findIndex(user, ["channel",channel.name]);
                            if(found !=-1){
                                reissueChannels.push({name:channel.name,description:channel.description,uuid:user.uuid});
                            }else {
                                addChannels.push({name:channel.name,description:channel.description});
                            }
                            sb();
                        }, function close() {
                            if(payload.status==='ADD'){
                                next(null, addChannels);
                            }else {
                                next(null, reissueChannels);
                            }
                        });
                    }
                ],
                function done(err, result) {
                    if (!err && result) {
                        callback(null, {code: '00', message: 'success', data: result});
                    } else {
                        callback({code: '06', message: err});
                    }
                });
            break;
        case 'add_channel':
            async.waterfall([
                    function findUser(next) {
                        User.findOne({msisdn:payload.msisdn}, function (err, authDoc) {
                            if (!err && authDoc) {
                                next(null, authDoc);
                            }
                            else {
                                if (err) {
                                    next(err, null);
                                } else {
                                    next('#auth.ntf', null);
                                }
                            }
                        });
                    },
                    function findAuth(user ,next) {
                        AuthDetail.findOne({channel:payload,user:user._id}, function (err, authDoc) {
                            if (!err && authDoc) {
                                next('channel.data.exist', null);
                            }
                            else {
                                if (err) {
                                    next(err, null);
                                } else {
                                    next(null, user);
                                }
                            }
                        });
                    },
                    function doAuth(user, next) {
                            var auth                = AuthDetail();
                            auth.user               = user._id;
                            auth.uuid               = user.msisdn;
                            auth.auth_history       =   [];
                            auth.channel            =   payload.channel;
                            auth.organizationID     =   'BG-SERVER';
                            auth.device             =   {
                                deviceId : user.msisdn,
                                platform : "IOS",
                                status : "ACTIVE",
                                token : ""
                            };
                            auth.hash               =   '#';
                            auth.status             =   'REISSUE';
                            auth.device_history     =   [];
                            next(null, user, auth);
                    },
                    function doChannel(user, auth ,next) {
                        var audit = new AuditAuthDetail();
                        audit.updating = user._id || null;
                        audit.old_details = null;
                        audit.new_details = auth;
                        audit.query = {channel:payload,user:user._id};
                        audit.msisdn = payload.msisdn;
                        audit.persist(payload.user, function (error, record) {
                            if (!error && record) {
                                next(null, record);
                            } else {
                                next('unable to process update request2', null);
                            }
                        });
                    }
                ],
                function done(err, result) {
                    if (!err && result) {
                        callback({code: '00', message: 'success', data: result});
                    } else {
                        callback({code: '06', message: err});
                    }
                });
            break;
        case 'process_channel':
            async.waterfall([
                    function get_pending(next) {
                        AuditAuthDetail.findOne({_id: payload.id}, function (err, auth) {
                            if (!err && auth) {
                                next(null, auth);
                            } else {
                                next('audit.process.registration.customer.data.ntf', null);
                            }
                        });
                    },
                    function check_channel(add_auth, next) {
                        AuthDetail.findOne(add_auth.query, function (err, auth) {
                            if (!err && auth) {
                                next('audit.process.channel.already.exist', null);
                            }else if(err){
                                next('audit.process.registration.account.data.ntf', null);
                            } else {
                                payload['msisdn'] = add_auth.msisdn;

                                payload['channel'] = add_auth.new_details.channel;
                                next(null, add_auth.new_details);
                            }
                        });
                    },
                    function doPassword(user, next) {
                        var password ='';
                        if(payload.channel==='USSD'){
                            password = randomize('0', 4);
                        }else {
                            password = randomize('A', 2)+randomize('a', 2)+ randomize('0', 2)+'!';
                        }
                        payload['token'] = password;
                        next(null, password, user);
                    },
                    function doSecurity(password, user, next) {
                        config.locate("PASSWORDRULES_" +payload.channel,function(err,info) {
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
                                helper.encrypt(password, function (err, hash) {
                                    if (!err && hash) {
                                        payload['ib_password'] = hash;
                                        next(null, user);
                                    } else {
                                        next(err);
                                    }
                                })
                            }else
                            {
                                next("Password not valid");
                            }
                        });
                    },
                    function create_auth(user, next) {
                        if (payload.status.toUpperCase() === 'APPROVED') {
                            user.hash = payload.ib_password;
                            var new_auth = AuthDetail(user);
                            new_auth.persist(payload.user, function (error, record) {
                                if (!error && record) {
                                    next(null, record);
                                } else {
                                    next('audit.customer.rigistration.fail', null);
                                }
                            })
                        } else {
                            next(null, user);
                        }
                    },
                    function DoUpdateAudit(user, next) {
                        AuditAuthDetail.findOne({_id: payload.id}, function (err, data) {
                            if (!err && data) {
                                data.status = payload.status;
                                data.persist(payload.user, function (error, record) {
                                    if (!error && record) {
                                        next(null, record);
                                    } else {
                                        next('unable to process update request3', null);
                                    }
                                })
                            } else {
                                next('unable to process update request4', null);
                            }
                        })
                    },
                    function getRoles(record, next) {
                        var channel = payload.channel!='INTERNET_BANKING'?payload.channel:'IB';
                        Role.findOne({name:'Customer-'+channel}, function (err, role) {
                            if(!err && role){
                                record.roles.push(role._id);
                                next(null, record);
                            }else {
                                next(null, record);
                            }
                        });

                    },
                    function doRoles(record, next) {
                        User.findOne({msisdn: record.msisdn}, function (err, user_rec) {
                            if (!err && user_rec) {
                                var temp = record.roles;
                                user_rec.roles = temp.concat(user_rec.roles);
                                user_rec.persist(payload.user, function (user_err, user_data) {
                                    next(null , user_data);
                                })
                            }
                        })
                    }
                ],
                function done(err, result) {
                    if (!err) {
                        callback({code: '00', message: 'success', data: {channel:payload.channel,token:payload.token, msisdn:result.msisdn}});
                    } else {
                        callback({code: '06', message: err, data: {}});
                    }
                });
            break;
        default:
            callback({code: '06', message: '#payload.action.invalid'});
    }


};
module.exports = handler;
