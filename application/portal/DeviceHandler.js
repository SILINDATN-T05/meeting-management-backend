
var express         =   require('express');
var router          =   express.Router();
var handler         =   express();
var logger          =   require('util');
var bodyParser      =   require('body-parser').json();
var User            =   require('../../model/User-model');
var Org             =   require('../../model/Organisation-model');
var Role            =   require('../../model/Role-model');
var user_helper     =   require('./helper/user_helper');

router.post('/block', bodyParser, function(req, res) {
    var data        = req.body;
    var user_id     = data.user_id;
    var user        = data.user;
    User.finOne({_id: user_id}, function(err, doc){
        if(!err && doc){
            doc.lockUserDevice(user, function(err){
                if(!err){
                    res.send({code:'00', message:'success'});
                }else{
                    res.send({code:'06', message:err.message, data:{id: user_id}});
                }
            });
        }else{
            res.send({code:'06', message:'#user.bloc.device.user.invalid', data:{id: user_id}});
        }
    });
});
router.post('/release', bodyParser, function(req, res) {
    var data        = req.body;
    var user_id     = data.user_id;
    var user        = data.user;
    User.finOne({_id: user_id}, function(err, doc){
        if(!err && doc){
            doc.releaseDevice(user, function(err){
                if(!err){
                    res.send({code:'00', message:'success'});
                }else{
                    res.send({code:'06', message:err.message, data:{id: user_id}});
                }
            });
        }else{
            res.send({code:'06', message:'#user.release.device.user.invalid', data:{id: user_id}});
        }
    });
});
router.post('/history', bodyParser, function(req, res) {
    var data        = req.body;
    var user_id     = data.user_id;
    var user        = data.user;
    User.finOne({_id: user_id}, function(err, doc){
        if(!err && doc){
            res.send({code:'00', message:'success', data:{history: doc.deviceDetails.imsi}});
        }else{
            res.send({code:'06', message:'#user.release.device.user.invalid', data:{id: user_id}});
        }
    });
});
handler.use('/device', router);
module.exports = handler;
