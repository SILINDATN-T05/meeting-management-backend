var mongoose = require('mongoose');
var async = require('async');
var TranHandler = require('./TranHandler');
var User = mongoose.connection.model('User');
var Session = mongoose.connection.model('UserSession');
var AuthDetail = mongoose.connection.model('AuthDetail');
var Application = mongoose.connection.model('Application');
var Org = mongoose.connection.model('Organisation');
var helper = require('../../../engine/HashService');
var serverHelper = require('./helper/serverHelper');
var handler = new TranHandler();
var moment  = require('moment');
var S               =   require('string');
var Chance = require('chance');
var chance = new Chance();

handler.processStep = function (uri, headers, action, payload, callback) {
    action = payload.action;
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
                if (session.channel === "PORTAL") {
                    // query.uuid = payload.username;
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
                                next('#auth_handler.authdetail.ntf');
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
                else {
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
                if (user.status === 'ACTIVE'|| user.status === 'NEW' || user.status === 'REISSUE') {
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
                if(action === "APP-REG")
                {
                    next(null,  {code: '00', message: 'success'});
                }
                if(action === "OTP-CHECK")
                {
                    next(null,  {code: '00', message: 'success'});
                }
                else
                {
                    if(payload.useServerWebservice)
                    {
                        serverHelper.comparePasswords(payload.username,payload.password,function(err,matches){
                            if(matches && err==="00")
                            {
                                if(auth.status === 'NEW' || auth.status === 'REISSUE' || auth.status ==='BLOCKED'){
                                    var result = {code: '06', message: '#auth_handler.auth.status.' + auth.status, data: {}};
                                    next(err, result);
                                }else {
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
                    }else
                    {
                        helper.compare(payload.password, auth.hash, function (err, isMatch) {
                            if (!err && isMatch === true) {
                                if(auth.status === 'NEW' || auth.status === 'REISSUE' || auth.status ==='BLOCKED'){
                                    var result = {code: '06', message: '#auth_handler.auth.status.' + auth.status, data: {}};
                                    next(err, result);
                                }else {
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
                                        if(auth.status ==='BLOCKED') {
                                            result = {code: '06', message: '#auth_handler.auth.status.' + auth.status, data: {}};
                                        }else {
                                            result = {code: '06', message: '#auth_handler.password.invalid', data: {}};
                                        }
                                        next(err, result);
                                    });
                                } else {
                                    auth.incrementAttempts(user, function () {
                                        if(auth.status ==='BLOCKED') {
                                            result = {code: '06', message: '#auth_handler.auth.status.' + auth.status, data: {}};
                                        }else {
                                            result = {code: '06', message: '#auth_handler.action.failed', data: {}};
                                        }
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
};
module.exports = handler;
