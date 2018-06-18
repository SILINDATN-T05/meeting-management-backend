let express = require('express');
let router = express.Router();
let handler = express();
let Notification = require('../../model/Notification-model');
let log4js = require('log4js');
let logger = log4js.getLogger('ATTACHMENTHANDLER');
logger.level = 'debug';

router.post('/not_list_all', function (req, res) {
    const query = req.body.query || {};
    let options = req.body.options || null;
    Notification.find(query,null, options, function (err, result) {
        if (!err) {
            res.send({code: '00', message: 'success', data: result});
        } else {
            res.send({code: '06', message: '#permission.list_all.refused'});
        }
    });

});

handler.use('/attachment', router);
module.exports = handler;
