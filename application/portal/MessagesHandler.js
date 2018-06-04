let Message = require('../../model/Locale-model');
let express = require('express');
let router = express.Router();

router.post('/message/create', function (req, res) {
    let payload = req.body;
    let user = payload.user;
    let message = new Message();
    message.code = payload.code;
    message.description = payload.description;
    message.organizationID = payload.org;
    message.message = payload.message;
    message.persist(user, function (err, doc) {
        if (!err && doc) {
            res.send({code: '00', message: 'success', data: doc});
        } else {
            res.send({code: '06', message: err.message});
        }
    });
});
router.post('/message/list', function (req, res) {
    Message.find({}, function (err, docs) {
        res.send({code: '00', message: 'success', data: docs});
    });
});
router.post('/message/delete', function (req, res) {
    let payload = req.body;
    let user = payload.user;
    let id = payload.id;
    Message.findOne({_id: id}, function (err, doc) {
        if (err || !doc) {
            res.send({code: '06', message: '#message.delete.ntf'});
        } else {
            doc.remove(user, function () {
                res.send({code: '06', message: 'success'});
            });
        }
    });
});
router.post('/message/edit', function (req, res) {
    let payload = req.body;
    let user = payload.user;
    let id = payload._id;
    let c_ode = payload.code;
    let desc = payload.description;
    let msg = payload.message;

    Message.findOne({_id: id}, function (err, doc) {
        if (!err && doc) {
            Message.findOne({code: c_ode, message: msg}, function (err, other) {
                if (other) {
                    res.send({code: '06', message: '#message.already.exists'});
                } else {
                    doc.message = msg[0];
                    doc.code = c_ode;
                    doc.description = desc;
                    doc.persist(user, function (err, doc) {
                        if (!err && doc) {
                            res.send({code: '00', message: 'success', data: doc.message});
                        } else {
                            res.send({code: '06', message: 'edit failed', error: err});
                        }
                    });
                }
            });
        } else {
            res.send({code: '06', message: 'edit failed'});
        }
    });

});
router.post('/message/addLanguage', function (req, res) {
    let payload = req.body;
    let user = payload.user;
    let code = payload.code;

    Message.findOne({code: code, override: 'YES'}, function (err, message) {
        if (err || !message) {
            res.send({code: '06', message: 'there is an error'});
        } else {
            let msg = payload.message;
            if (msg && msg.length) {
                for (let x = 0; x < msg.length; x++) {
                    let d = msg[x];
                    message.message.push({language: d.language, text: d.text});
                }
            }
            message.persist(user, function (err, language) {
                if (!err && language) {
                    res.send({code: '00', message: 'success', data: language});
                } else {
                    res.send({code: '06', message: '#language.add.failed', error: err, language: language});
                }
            });
        }
    });
});
module.exports = router;
