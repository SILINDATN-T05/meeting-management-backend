
var express            =   require('express');
var helper             =   require('./../../application/context/tran_handler/helper/query_helper');
var audit_helper       =   require('./../../application/context/tran_handler/helper/auditHelper');
var AuthDetail         =   require('../../model/AuthDetail-model');
var User               =   require('../../model/User-model');
var configurations     =   require('../../engine/ConfigService');
var config             =   new configurations();
var service            =   require('../../engine/HashService');
var S                  =   require('string');
var passwordSheriff    =   require('password-sheriff');
var shortid            =   require('shortid');
var PasswordPolicy     =   passwordSheriff.PasswordPolicy;
var logger             =   require('util');
var async              =   require('async');
var Chance             =   require('chance');
var _                  = require('lodash');

var randomize = require('randomatic');
var chance             =   new Chance();
var charsets           =   passwordSheriff.charsets;
var router             =   express.Router();

router.post('/auth/request', function(req, res){
    var payload = req.body;
    var user = {_id:payload.updated_by};
    async.waterfall([
            function doQuery(next) {
                if(payload.query){
                    if(payload.query && payload.query.channel && payload.query.channel==="PORTAL"){
                        next(err, payload.query);
                    }else {
                        helper.prepare(payload.query, function (err, query) {
                            next(err, Array.isArray(query) ? query[0] : query);
                        });
                    }
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
                audit.questions  = payload.questions;
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

router.post('/auth/block_channel', function(req, res) {
    var payload = req.body;
    async.waterfall([
            function findUser(next) {
                User.findOne({msisdn: payload.msisdn}, function (err, user) {
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
                AuthDetail.find({user: user._id}, function (err, authDoc) {
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
                    if (payload.channel === 'ALL' && authData.channel != 'OTP') {
                        authData.status = 'BLOCKED';
                        blocked_auth.push(authData);
                    } else if (payload.channel === authData.channel) {
                        authData.status = 'BLOCKED';
                        blocked_auth.push(authData);
                    }
                    sb();
                }, function close() {
                    next(null, blocked_auth, user);
                });
            },
            function get_old_details(auth, user, next) {
                var data = [];
                async.forEachOf(auth, function (authData, i, sb) {
                    AuthDetail.findOne({user: user._id, channel: authData.channel}, function (err, authDoc) {
                        if (!err && authDoc) {
                            data.push({new: authData, old: authDoc})
                            sb();
                        }
                    });
                }, function close() {
                    next(null, data, user);
                });
            },
            function saveUpdateRequest(auth, user, next) {
                async.forEachOf(auth, function (authData, i, sb) {
                    var audit = new AuditAuthDetail();
                    audit.updating = user._id;
                    audit.old_details = authData.old;
                    audit.new_details = {status: authData.new.status};
                    audit.query = {user: user._id, channel: authData.new.channel};
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
                    next(null, user);
                });
            }
        ],
        function done(err, result) {
            if (!err && result) {
                res.send({code: '00', message: 'success', data: result});
            } else {
                res.send({code: '06', message: err});
            }
        });
});
router.post('/auth/list_channel', function(req, res) {
    var payload = req.body;
    async.waterfall([
            function findUser(next) {
                User.findOne({msisdn: payload.msisdn}, function (err, authDoc) {
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
            function findAuth(user, next) {
                AuthDetail.find({user: user._id}, function (err, authDoc) {
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
            function doChannel(user, next) {
                var channels = [{name: 'PORTAL', description: 'PORTAL'}];
                var addChannels = [];
                var reissueChannels = [];
                if(channels.length==0){

                }
                async.forEachOf(channels, function (channel, i, sb) {
                    var found = _.findIndex(user, ["channel", channel.name]);
                    if (found != -1) {
                        reissueChannels.push({name: channel.name, description: channel.description, uuid: user[found].uuid});
                    } else {
                        addChannels.push({name: channel.name, description: channel.description});
                    }
                    sb();
                }, function close() {
                    if (payload.status === 'ADD') {
                        next(null, addChannels);
                    } else {
                        next(null, reissueChannels);
                    }
                });
            }
        ],
        function done(err, result) {
            if (!err && result) {
                res.send({code: '00', message: 'success', data: result});
            } else {
                res.send({code: '06', message: err});
            }
        });
});
router.post('/auth/add_channel', function(req, res) {
    var payload = req.body;
    async.waterfall([
            function findUser(next) {
                User.findOne({msisdn: payload.msisdn}, function (err, authDoc) {
                    if (!err && authDoc) {
                        authDoc.username = payload.employee_id;
                        authDoc.persist({_id:payload.supervisor}, function (error, user_updated) {
                            if(!error &&user_updated){
                                next(null, user_updated);
                            }else {
                                next('add_channel.user.data.ntf',null);
                            }
                        });
                       // next(null, authDoc);
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
                AuthDetail.findOne({channel: payload.user_channel, user: user._id}, function (err, authDoc) {
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
                var auth = AuthDetail();
                auth.user = user._id;
                auth.uuid = payload.employee_id;
                auth.auth_history = [];
                auth.channel = payload.user_channel;
                auth.organizationID = 'BG-SERVER';
                auth.device = {
                    deviceId: payload.employee_id,
                    platform: "IOS",
                    status: "ACTIVE",
                    token: ""
                };
                auth.hash = '#';
                auth.status = 'REISSUE';
                auth.device_history = [];
                next(null, user, auth);
            },
            function doChannel(user, auth, next) {
                var audit = new AuditAuthDetail();
                audit.updating = user._id || null;
                audit.old_details = null;
                audit.new_details = auth;
                audit.query = {channel: payload.user_channel, user: user._id};
                audit.email = payload.email;
                audit.roles = payload.roles;
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
                res.send({code: '00', message: 'success', data: result});
            } else {
                res.send({code: '06', message: err});
            }
        });
});
router.post('/auth/list', function(req, res){
    AuditAuthDetail.find({}, function (err, auths) {
        if(!err && auths){
            var extras = [];
            async.forEachOf(auths, function (auth, i, sb){
                if(auth.status==='PENDING' && auth.old_details ===null){
                    extras.push(auth);
                }
                sb();
            }, function close(){
                res.send({code: '00', message: 'success',data: {authDetail: extras}});
            });
        }else {
            res.send({code: '06', message: 'auth.audit.auth.detail.ntf',data:{}});
        }
    })
});
router.post('/auth/search_user', function(req, res){
    var payload = req.body;
    AuthDetail.find({user:payload.id}, function (err, auths) {
        if(!err && auths){
            res.send({code: '00', message: 'success',data: {authDetail: auths}});
        }else {
            res.send({code: '06', message: 'auth.audit.auth.detail.ntf',data:{}});
        }
    })
});
router.post('/auth/process_update', function(req, res){
    var payload1 = req.body;
    var payload = {};
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
                var temp;
                if(payload.channel==='USSD'){
                    payload['successText'] = 'Your PIN has been reset.  Your temporary pin is {password}, please change immediately. If you did not request for a new PIN, ﻿contact Bank Gaborone on +267 3671690';
                    password = randomize('0', 5);
                    next(null, password, user);
                }else {
                    if(payload.channel==='APP'){
                        payload['successText'] ='App password reset. Your temporary password is {password}, please change immediately. If you did not make this request, ﻿contact Bank Gaborone on +267 3671690';
                    }else if(payload.channel==='PORTAL'){
                        payload['successText'] ='Portal password reset.  Your temporary password is {password}, please change immediately. If you did not  make this request, ﻿contact Bank Gaborone on +267 3671690.';
                    }else{
                        payload['successText'] ='IB password reset.  Your temporary password is {password}, please change immediately. If you did not  make this request, ﻿contact Bank Gaborone on +267 3671690.';
                    }
                    password =randomize('A', 2)+randomize('a', 2)+ randomize('0', 2)+'!';
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
                                if(data.auth_history.length<12) {
                                    data.auth_history.push({
                                        previousHash: data.hash,
                                        change_date: moment().format("YYYY-MM-DD HH:mm"),
                                        reason: moment().format("YYYY-MM-DD HH:mm"),
                                        channel: data.channel
                                    })
                                }else{
                                    var dates = data.auth_history;
                                    dates = data.auth_history.sort(function(a,b){
                                        return Date.parse(a.change_date) > Date.parse(b.change_date);
                                    });
                                    dates.pop();
                                    dates.push({
                                        previousHash: data.hash,
                                        change_date: moment().format("YYYY-MM-DD HH:mm"),
                                        reason: moment().format("YYYY-MM-DD HH:mm"),
                                        channel: data.channel
                                    });
                                    data.auth_history = dates;
                                }
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
                                        var successMessge        =    new Notification();
                                        successMessge.message    =   S(payload.successText).replaceAll('{password}',password).s;
                                        successMessge.server_ref    =   chance.zip(); /// this is for testing
                                        successMessge.type       =   'SMS';
                                        successMessge.owner      =   user;
                                        successMessge.msisdn     =   payload.msisdn;
                                        successMessge.save(function (err, data) {
                                        });
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
module.exports = router;
