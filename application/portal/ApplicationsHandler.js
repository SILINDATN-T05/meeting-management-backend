let express = require('express');
let router = express.Router();
let handler = express();
let bodyParser = require('body-parser').json();
let Application = require('../../model/Application-model');
let Org = require('../../model/Organisation-model');
let log4js = require('log4js');
let logger = log4js.getLogger('APPLICATIONHANDLER');
// let _ = require('lodash');
logger.level = 'debug';

let validateApplication = function (payload, callback) {
    if (!payload.applications.name) {
        return callback('#application.create.name.required');
    }
    if (!payload.applications.code) {
        return callback('#application.create.code.required');
    }
    if (!payload.applications.channel_name) {
        return callback('#application.create.channel.required');
    }
    Application.findOne({code: payload.applications.code}, function (err, app) {
        if (!err && app) {
            return callback('#application.create.code.used');
        } else {
            Org.findOne({_id: payload.applications.organisationID}, function (err, org) {
                if (!err && org) {
                    return callback(null, org);
                } else {
                    return callback('#application.create.organisation.required');
                }
            });
        }
    });
};
router.post('/create', bodyParser, function (req, res) {
    let payload = req.body;
    let user = payload.user;
    validateApplication(payload, function (err, org) {
        if (err) {
            res.send({code: '06', message: err});
            return;
        }
        let application = new Application();
        application.name = payload.applications.name;
        application.code = payload.applications.code;
        application.description = payload.applications.description;
        application.channel = payload.applications.channel_name;
        application.organizationID = org.organisationName;
        let permissions = payload.applications.permissions || [];
        for (i = 0; i < permissions.length; i++) {
            application.permissions.push(permissions[i]);
        }
        let trans_code = payload.applications.trans_code || [];
        for (i = 0; i < trans_code.length; i++) {
            let trans = trans_code[i];
            application.trans_code.push({code: trans.code, name: trans.name});
        }
        application.persist(user, function (err, app) {
            if (!err && app) {
                res.send({code: '00', message: 'success', data: app});
            } else {
                res.send({code: '06', message: '#application.create.error'});
            }
        });
    });
});
router.post('/list_all', bodyParser, function (req, res) {
    const query = req.body.query || {};
    Application.find(query, function (err, apps) {
        if (err) {
            res.send({code: '06', message: 'application.ntf'});
        } else {
            res.send({code: '00', message: 'success', data: apps});
        }
    });
});
router.post('/list_org', bodyParser, function (req, res) {
    let payload = req.body;
    let org = payload.organizationID;
    Application.find({organizationID: org, channel: {$ne: 'PORTAL'}}, function (err, apps) {
        if (!err) {
            res.send({code: '00', message: 'success', data: apps});
        } else {
            res.send({code: '06', message: err});
        }
    });
});
router.post('/update_permissions', bodyParser, function (req, res) {
    let data = req.body;
    let user = data.user;
    let org = data.organizationID;// app organisation
    let app = data.application;   // app _id
    let permissions = data.permissions;   // permissions array, IDs

    Application.findOne({_id: app, organizationID: org}, function (err, application) {
        if (application) {
            application.permissions = permissions;
            application.persist(user, function (err) {
                if (err) {
                    res.send({code: '06', message: err.message});
                } else {
                    res.send({code: '00', message: 'success'});
                }
            });
        } else {
            res.send({code: '06', message: '#application.update.invalid'});
        }
    });
});
router.post('/edit', function (req, res) {
    const data = req.body;
    const user = data.user;
    const org = data.applications.organizationID;
    const application = data.applications._id;
    Application.findOne({_id: application, organizationID: org}, function (err, doc) {
        if (!err && doc) {
            doc.name = data.applications.name;
            doc.description = data.applications.description;
            doc.permissions = data.applications.permissions
            doc.persist(user, function (err, result) {
                if (err) {
                    logger.fatal(err);
                    res.send({code: '06', message: '#application.update.failed'});
                } else {
                    res.send({code: '00', message: 'success', data: result});
                }
            });
        } else {
            res.send({code: '06', message: '#application.update.invalid'});
        }
    });
});
handler.use('/application', router);
module.exports = handler;
