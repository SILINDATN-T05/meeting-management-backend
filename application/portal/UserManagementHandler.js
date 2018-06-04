let express = require('express');
let router = express.Router();
let handler = express();
let bodyParser = require('body-parser').json();
let User = require('../../model/User-model');
let Language = require('../../model/Language-model');
let Org = require('../../model/Organisation-model');
let AuthDetail = require('../../model/AuthDetail-model');
let service = require('../../engine/HashService');
let user_helper = require('./helper/user_helper');
let Configurations = require('../../engine/ConfigService');
let config = new Configurations();
let Notification = require('../../model/Notification-model');
let passwordSheriff = require('password-sheriff');
let PasswordPolicy = passwordSheriff.PasswordPolicy;
let async = require('async');
let Chance = require('chance');
let chance = new Chance();
let randomize = require('randomatic');
let charsets = passwordSheriff.charsets;
let log4js = require('log4js');
let logger = log4js.getLogger('USER-API');
logger.level = 'debug';


router.post('/process_user', bodyParser, function (req, res) {
    let data = req.body;
    let admin = data.user;
    async.waterfall([
        function doValidate (next) {
            user_helper.validateCreateRequest(data, function (err) {
                if (err) {
                    next(err, null);
                } else {
                    next(null, data);
                }
            });
        },
        function doPassword (payload, next) {
            let password = '1';
            if (data.platform === 'WEB-API') {
                password = randomize('Aa0!', 16);
            } else {
                password = randomize('A', 1) + randomize('a', 4) + randomize('0', 2) + '!';
            }
            data['successText'] = 'Welcome Parts Portal. Your Password is ' + password + ', please change immediatley.If you did not make this request,contact Autoboys at +2710 600 7900.';
            next(null, password , payload);
        },
        function doSecurity (password, payload, next) {
            config.locate('PASSWORDRULES_' + payload.channel,function (err,info) {
                let expressionsArr = [];
                Object.keys(info.value).forEach(function (key, index) {
                    if (info.value[key]) {
                        switch (key) {
                        case 'digits':
                            expressionsArr.push(charsets.numbers);
                            break;
                        case 'lowercase':
                            expressionsArr.push(charsets.lowerCase);
                            break;
                        case 'uppercase':
                            expressionsArr.push(charsets.upperCase);
                            break;
                        case 'symbols':
                            expressionsArr.push(charsets.specialCharacters);
                            break;
                        default:
                            logger.fatal(index + ' has a problem');

                        }

                    }
                })
                let policy = new PasswordPolicy({
                    length: {
                        minLength: info.value.length
                    },
                    containsAtLeast: {
                        atLeast: info.value.atLeast,
                        expressions: expressionsArr
                    }
                });
                if (policy.check(password))
                    {
                    service.encrypt(password, function (err, hash) {
                        if (!err && hash) {
                            data['password'] = {
                                hash: hash
                            };
                            next(null, payload);
                        } else {
                            next(err, null);
                        }
                    })
                } else
                    {
                    next('Password not valid', null);
                }
            });
        },
        function getLanguage (payload, next) {
            Language.findOne({system_default: true}, function (err, language_doc) {
                if (!err && language_doc) {
                    payload['language'] = language_doc._id;
                    next(null, payload);
                } else {
                    next(null, payload);
                }
            })
        },
        function doCreateUser (payload, next) {
            user_helper.createUser(payload, admin, function (err, user) {
                if (!err && user) {
                    next(null, user , payload);
                } else {
                    next(err, null);
                }
            });
        },
        function DoAuth (user, payload, next) {
            let expiry_date = new Date();
            expiry_date.setDate(expiry_date.getDate() + 30);
            let auth = AuthDetail();
            auth.user = user._id;
            auth.channel = data.platform === 'WEB-API' ? data.platform : payload.channel;
            auth.uuid = payload.username;
            auth.organizationID = payload.organizationID;
            auth.status = data.platform === 'WEB-API' ? 'ACTIVE' : 'REISSUE';
            auth.STATUS = data.platform === 'WEB-API' ? 'ACTIVE' : 'REISSUE';
            auth.device = {
                deviceId: payload.deviceId || payload.username,
                platform: data.platform === 'WEB-API' ? data.platform : payload.channel
            };
            auth.hash = data.password.hash;
            auth.expiry_date = expiry_date;
            auth.persist(admin, function (error, auth_data) {
                if (!error && auth_data) {
                    let successMessge = new Notification();
                    successMessge.message = data.successText;
                    successMessge.server_ref = chance.zip(); // / this is for testing
                    successMessge.type = 'SMS';
                    successMessge.owner = user._id;
                    successMessge.msisdn = payload.msisdn;
                    successMessge.save(function (err, data) {
                        if (err && !data) {
                            logger.fatal(err.message);
                        }
                    });
                    next(null, user);
                } else {
                    next(error, null);
                }
            });
        }],
        function done (err, result) {
            if (!err) {
                res.send({code: '00', message: 'success',data: result});
            } else {
                res.send({code: '06', message: err});
            }
        });
});
router.post('/list', bodyParser, function (req, res) {
    let data = req.body;
    let session = data.session;
    Org.findOne({organisationName: session.organizationID}, function (err, org) {
        if (!err && org) {
            if (org.system === 'YES') {
                User.find({}, function (err, users) {
                    res.send({code: '00', message: 'success', data: users});
                });
            } else {
                res.send({code: '09', message: 'not implemented yet'});
            }
        } else {
            res.send({code: '06', message: '#user.list.notallowed'});
        }
    });
});
router.post('/list_all', bodyParser, function (req, res) {
    const query = req.body.query || {};
    if (query != {} && query.hasOwnProperty('NAME')) {
        async.waterfall([
            function getBranches (next) {
                Branch.find(query, function (err, result) {
                    if (!err && result.length > 0) {
                        let branch_ids = [];
                        async.forEachOf(result, function (branch, i, sb) {
                            branch_ids.push(branch._id);
                            sb();
                        },
                            function close () {
                                next(null, branch_ids);
                            });
                    } else {
                        next('#branch.list_by_id.ntf', null);
                    }
                });
            },
            function getUsers (branch_ids, next) {
                User.find({branch: {$in: branch_ids}}, function (err, result) {
                    next(err, result)
                });
            }
        ],
        function done (err, result) {
            if (!err) {
                res.send({code: '00', message: 'success', data: result});
            } else {
                res.send({code: '06', message: '#permission.list_all.refused'});
            }
        });
    } else {
        User.find(query, function (err, result) {
            if (!err) {
                res.send({code: '00', message: 'success', data: result});
            } else {
                res.send({code: '06', message: '#permission.list_all.refused'});
            }
        });
    }
});

router.post('/reissue_user_password', bodyParser, function (req, res) {
    let data = req.body;
    let admin = data.user;
    async.waterfall([
        function doPassword (next) {
            let password = randomize('Aa0!', 16);
            let p_password = randomize('A', 1) + randomize('a', 4) + randomize('0', 2) + '!';
            data['p_successText'] = 'Parts Portal. Your Password is ' + p_password + ', please change immediatley.If you did not make this request,contact Autoboys at +2710 600 7900.';
            data['successText'] = 'Parts Portal Web-API. Your Password has been reset to ' + password + ', please change immediatley.If you did not make this request,contact Autoboys at +2710 600 7900.';
            next(null, password, p_password , data);
        },
        function doSecurity (password, p_password, payload, next) {
            config.locate('PASSWORDRULES_' + payload.channel,function (err,info) {
                let expressionsArr = [];
                Object.keys(info.value).forEach(function (key, index) {
                    if (info.value[key]) {
                        switch (key) {
                        case 'digits':
                            expressionsArr.push(charsets.numbers);
                            break;
                        case 'lowercase':
                            expressionsArr.push(charsets.lowerCase);
                            break;
                        case 'uppercase':
                            expressionsArr.push(charsets.upperCase);
                            break;
                        case 'symbols':
                            expressionsArr.push(charsets.specialCharacters);
                            break;
                        default:
                            logger.fatal(index + ' has a problem');
                        }

                    }
                })
                let policy = new PasswordPolicy({
                    length: {
                        minLength: info.value.length
                    },
                    containsAtLeast: {
                        atLeast: info.value.atLeast,
                        expressions: expressionsArr
                    }
                });
                if (policy.check(password))
                    {
                    service.encrypt(password, function (err, hash) {
                        if (!err && hash) {
                            data['password'] = {
                                hash: hash
                            };
                            next(null, p_password, payload);
                        } else {
                            next(err, null);
                        }
                    })
                } else
                    {
                    next('Password not valid', null);
                }
            });
        },
        function doSecurity (p_password, payload, next) {
            config.locate('PASSWORDRULES_' + payload.channel,function (err,info) {
                let expressionsArr = [];
                Object.keys(info.value).forEach(function (key, index) {
                    if (info.value[key]) {
                        switch (key) {
                        case 'digits':
                            expressionsArr.push(charsets.numbers);
                            break;
                        case 'lowercase':
                            expressionsArr.push(charsets.lowerCase);
                            break;
                        case 'uppercase':
                            expressionsArr.push(charsets.upperCase);
                            break;
                        case 'symbols':
                            expressionsArr.push(charsets.specialCharacters);
                            break;
                        default:
                            logger.fatal(index + ' has a problem');
                        }

                    }
                })
                let policy = new PasswordPolicy({
                    length: {
                        minLength: info.value.length
                    },
                    containsAtLeast: {
                        atLeast: info.value.atLeast,
                        expressions: expressionsArr
                    }
                });
                if (policy.check(p_password))
            {
                    service.encrypt(p_password, function (err, hash) {
                        if (!err && hash) {
                            data['p_password'] = {
                                hash: hash
                            };
                            next(null, payload);
                        } else {
                            next(err, null);
                        }
                    })
                } else
            {
                    next('Password not valid', null);
                }
            });
        },
        function getUser (payload, next) {
            User.findOne(payload.query, function (err, user_doc) {
                if (!err && user_doc) {
                    next(null, user_doc, payload);
                } else {
                    next('user.reissue.ntf', null);
                }
            })
        },
        function DoAuth (user, payload, next) {
            let expiry_date = new Date();
            expiry_date.setDate(expiry_date.getDate() + 30);
            AuthDetail.findOne({user: user._id, channel: payload.channel, organizationID: payload.organizationID}, function (err, auth) {
                if (!err && auth) {
                    auth.status = 'REISSUE';
                    auth.STATUS = 'REISSUE';
                    auth.hash = data.p_password.hash;
                    auth.expiry_date = expiry_date;
                    auth.persist(admin, function (error, auth_data) {
                        if (!error && auth_data) {
                            let successMessge = new Notification();
                            successMessge.message = data.p_successText;
                            successMessge.server_ref = chance.zip(); // / this is for testing
                            successMessge.type = 'SMS';
                            successMessge.owner = user._id;
                            successMessge.msisdn = user.msisdn;
                            successMessge.save(function (err, data) {
                                if (err && !data) {
                                    logger.fatal(err.message);
                                }
                            });
                            next(null, user);
                        } else {
                            next(error, null);
                        }
                    });
                } else {
                    AuthDetail.findOne({user: user._id, channel: 'WEB-API', organizationID: payload.organizationID}, function (err, auth) {
                        auth.hash = data.password.hash;
                        auth.expiry_date = expiry_date;
                        auth.persist(admin, function (error, auth_data) {
                            if (!error && auth_data) {
                                let successMessge = new Notification();
                                successMessge.message = data.successText;
                                successMessge.server_ref = chance.zip(); // / this is for testing
                                successMessge.type = 'SMS';
                                successMessge.owner = user._id;
                                successMessge.msisdn = user.msisdn;
                                successMessge.save(function (err, data) {
                                    if (err && !data) {
                                        logger.fatal(err.message);
                                    }
                                });
                                next(null, user);
                            } else {
                                next(error, null);
                            }
                        });
                    });
                }
            });
        }],
        function done (err, result) {
            if (!err) {
                res.send({code: '00', message: 'success',data: result});
            } else {
                res.send({code: '06', message: err});
            }
        });
});
router.post('/list_config', bodyParser, function (req, res) {
    let config_name = req.body.config_name;
    if (Array.isArray(config_name)) {
        let result = {};
        async.forEachOf(config_name, function (_config_name, index, callback) {
            config.locate(_config_name, function (err, info) {
                if (!err && info) {
                    result[_config_name] = info.value.items;
                    callback();
                } else {
                    logger.fatal(err.message || err);
                    callback();
                }
            });
        }, function close () {
            res.send({code: '00', message: 'success', data: result});
        })

    } else {
        config.locate(config_name, function (err, info) {
            if (!err && info) {
                res.send({code: '00', message: 'success', data: info});
            } else {
                res.send({code: '06', message: '#user.list.config.ntf'});
            }
        });
    }
});
router.post('/deactivate', bodyParser, function (req, res) {
    const data = req.body;
    let update_user_id = data.update_user_id;
    let admin = data.user;
    async.waterfall([
        function getUser (next) {
            User.findOne({_id: update_user_id}, function (err, user_doc) {
                if (!err && user_doc) {
                    user_doc.STATUS = 'INACTIVE';
                    user_doc.persist(admin, function (err, updated_user) {
                        if (!err && updated_user) {
                            next(null, updated_user);
                        } else {
                            next('user.deactivate.failed', null);
                        }
                    })
                } else {
                    next('user.deactivate.not.found', null);
                }
            })
        },
        function DoAuth (user, next) {
            AuthDetail.find({user: user._id}, function (err, auths) {
                async.forEachOf(auths, function (auth, index, cb) {
                    auth.status = 'INACTIVE';
                    auth.STATUS = 'INACTIVE';
                    auth.persist(admin, function (error, auth_data) {
                        if (!error && auth_data) {
                            logger.info('auth.' + index + '.updated.successfully')
                        } else {
                            logger.fatal('auth.' + index + ' update.failed')
                        }
                        cb();
                    });
                }, function close () {
                    next(null, user);
                })
            });
        }],
    function done (err, result) {
        if (!err && result) {
            res.send({code: '00', message: 'success', data: result});
        } else {
            res.send({code: '06', message: err});
        }
    });
});
router.post('/activate', bodyParser, function (req, res) {
    const data = req.body;
    let update_user_id = data.update_user_id;
    let admin = data.user;
    async.waterfall([
        function getUser (next) {
            User.findOne({_id: update_user_id}, function (err, user_doc) {
                if (!err && user_doc) {
                    user_doc.STATUS = 'ACTIVE';
                    user_doc.persist(admin, function (err, updated_user) {
                        if (!err && updated_user) {
                            next(null, updated_user);
                        } else {
                            next('user.activate.failed', null);
                        }
                    })
                } else {
                    next('user.activate.not.found', null);
                }
            })
        },
        function DoAuth (user, next) {
            AuthDetail.find({user: user._id}, function (err, auths) {
                async.forEachOf(auths, function (auth, index, cb) {
                    auth.status = 'ACTIVE';
                    auth.STATUS = 'ACTIVE';
                    auth.persist(admin, function (error, auth_data) {
                        if (!error && auth_data) {
                            logger.info('auth.' + index + '.updated.successfully')
                        } else {
                            logger.fatal('auth.' + index + ' update.failed')
                        }
                        cb();
                    });
                }, function close () {
                    next(null, user);
                })
            });
        }],
    function done (err, result) {
        if (!err && result) {
            res.send({code: '00', message: 'success', data: result});
        } else {
            res.send({code: '06', message: err});
        }
    });
});
router.post('/change_username', bodyParser, function (req, res) {
    const data = req.body;
    let update_user_id = data.update_user_id;
    let admin = data.user;
    async.waterfall([
        function getUser (next) {
            User.findOne({_id: update_user_id}, function (err, user_doc) {
                if (!err && user_doc) {
                    user_doc.username = data.new_username;
                    user_doc.persist(admin, function (err, updated_user) {
                        if (!err && updated_user) {
                            next(null, updated_user);
                        } else {
                            next('user.username.failed', null);
                        }
                    })
                } else {
                    next('user.username.not.found', null);
                }
            })
        },
        function DoAuth (user, next) {
            AuthDetail.find({user: user._id}, function (err, auths) {
                async.forEachOf(auths, function (auth, index, cb) {
                    auth.uuid = data.new_username;
                    auth.persist(admin, function (error, auth_data) {
                        if (!error && auth_data) {
                            logger.info('auth.' + index + '.updated.successfully')
                        } else {
                            logger.fatal('auth.' + index + ' update.failed')
                        }
                        cb();
                    });
                }, function close () {
                    next(null, user);
                })
            });
        }],
    function done (err, result) {
        if (!err && result) {
            res.send({code: '00', message: 'success', data: result});
        } else {
            res.send({code: '06', message: err});
        }
    });
});
router.post('/updated_user', bodyParser, function (req, res) {
    const data = req.body;
    let update_user = data.update_user;
    let admin = data.user;
    User.findOne({_id: update_user._id}, function (err, user_doc) {
        if (!err && user_doc) {
            user_doc.firstName = update_user.firstName;
            user_doc.lastName = update_user.lastName;
            user_doc.msisdn = update_user.msisdn;
            user_doc.branch = update_user.branch;
            user_doc.email = update_user.email;
            user_doc.roles = update_user.roles;
            user_doc.insurer = update_user.insurer;
            user_doc.persist(admin, function (err, updated_user) {
                if (!err && updated_user) {
                    res.send({code: '00', message: 'success', data: updated_user});
                } else {
                    res.send({code: '06', message: err});
                }
            })
        } else {
            res.send({code: '06', message: 'user.update.not.found'});
        }
    })
});

handler.use('/user', router);
module.exports = handler;
