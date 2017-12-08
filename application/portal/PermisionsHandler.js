
var express         =   require('express');
var log4js          =   require('log4js');
var router          =   express.Router();
var Permission      =   require('../../model/Permission-model');
var Role            =   require('../../model/Role-model');

var logger          =   log4js.getLogger('PemissionHandler');

router.post('/permission/list_all', function(req, res) {
    Permission.find({}, function(err, result){
        res.send({code:'00', message: 'success', data: result});
    });
});
router.post('/permission/list_org', function(req, res) {
    Permission.find({system: { $ne: 'YES' }}, function(err, result){
        res.send({code:'00', message: 'success', data: result});
    });
});
router.post('/permission/list_channel', function(req, res) {
    var channel =   req.channel_name;
    Permission.find({channel:channel}, function(err, result){
        res.send({code:'00', message: 'success', data: result});
    });
});
router.post('/permission/list_channel_org', function(req, res) {
    var channel =   req.channel_name;
    Permission.find({channel:channel, system: { $ne: 'YES' }}, function(err, result){
        res.send({code:'00', message: 'success', data: result});
    });
});
//proxy.post('/permission/updatePermission', function(req, res){
//var data        =   req.body;
//
//Permission.find({system: {$ne: 'YES'}},function(err, result){
//if(err){
//res.send({code:'06', message:'error', data: err.message});
//}else{
//res.send({code:'00', message:'success', data: result});
//console.log(data.user.roles);
//}
//});
//});
module.exports = router;
