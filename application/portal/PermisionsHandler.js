const express = require('express');
const router = express.Router();
const handler = express();
const Permission = require('../../model/Permission-model');

router.post('/create', function (req, res) {
    const data = req.body
    const user = data.user
    Permission.findOne({code: data.permission.code, override: 'YES'}, function (err, permission) {
        if (!err && permission) {
            res.send({code: '06', message: '#permission.create.code.exist'});
            return;
        }
        permission = new Permission();
        permission.code = data.permission.code;
        permission.category = data.permission.category;
        permission.type = data.permission.type;
        permission.menu = data.permission.menu;
        permission.channel = data.channel;
        permission.persist(user, function (err, permission_doc) {
            if (!err && permission_doc) {
                res.send({code: '00', message: 'success', data: permission_doc});
            } else {
                res.send({code: '06', message: '#permission.create.failed'});
            }
        });
    });
});
router.post('/list_all', function (req, res) {
    const query = req.body.query || {};
    Permission.find(query, function (err, result) {
        if (!err) {
            res.send({code: '00', message: 'success', data: result});
        } else {
            res.send({code: '06', message: '#permission.list_all.refused'});
        }
    });

});
router.post('/list_by_id', function (req, res) {
    const data = req.body;
    Permission.find({_id: {$in: data.permissions}}, function (err, result) {
        if (!err && result) {
            res.send({code: '00', message: 'success', data: result});
        } else {
            res.send({code: '06', message: '#permission.list_by_id.ntf'});
        }
    });
});
router.post('/edit', function (req, res) {
    const data = req.body;
    const user = data.user;
    const permission = data.permission._id;
    Permission.findOne({_id: permission}, function (err, doc) {
        if (!err && doc) {
            doc.category = data.permission.category;
            doc.type = data.permission.type;
            doc.menu = data.permission.menu;
            doc.channel = data.channel;
            doc.persist(user, function (err, result) {
                if (err) {
                    res.send({code: '06', message: '#permission.update.failed'});
                } else {
                    res.send({code: '00', message: 'success', data: result});
                }
            });
        } else {
            res.send({code: '06', message: '#permission.update.invalid'});
        }
    });
});

handler.use('/permission', router);
module.exports = handler;
