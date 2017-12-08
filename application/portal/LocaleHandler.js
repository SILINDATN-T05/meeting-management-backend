
var express         =   require('express');
var router          =   express.Router();
var logger          =   require('util');
var Locale          =   require('../../model/Locale-model');

router.post('/locale/all', function(req, res) {
    Locale.find({}, function(err, result){
        res.send({code:'00', message: 'success', data: result});
    });
});
router.post('/locale/create', function(req, res) {
    var data    =   req.body;
    var user    =   data.user;
    var locale  =   new Locale();
    locale.code =   data.code;
    locale.text =   data.text;
    locale.persist(user, function(err, doc){
        if(!err && doc){
            res.send({code:'00', message: 'success', data: doc});
        }else{
            console.error('__Locale:', err);
            res.send({code:'06', message: '#locale.create.failed'});
        }
    });
});
router.post('/locale/update', function(req, res) {
    var data    =   req.body;
    var user    =   data.user;
    Locale.findOne({code:data.code}, function(err, locale){
        if(!locale){
            res.send({code:'06', message: '#locale.update.invalid'});
        }else{
            locale.text =   data.text;
            locale.persist(user, function(err, doc){
                if(!err && doc){
                    res.send({code:'00', message: 'success', data: doc});
                }else{
                    console.error('__Locale:', err);
                    res.send({code:'06', message: '#locale.update.failed'});
                }
            });
        }
    });
});
router.post('/locale/delete', function(req, res) {
    var data    =   req.body;
    var user    =   data.user;
    Locale.findOne({code:data.code}, function(err, locale){
        if(!locale){
            res.send({code:'06', message: '#locale.delete.invalid'});
        }else{
            locale.remove(user, function(){});
            res.send({code:'00', message: 'success'});
        }
    });
});
module.exports = router;
