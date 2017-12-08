
var express            =   require('express');
var router             =   express.Router();
var handler            =   express();
var logger             =   require('util');
var bodyParser         =   require('body-parser').json();
var shortid            =   require('shortid');
var configurations     =   require('../../engine/ConfigService');
var config             =  new configurations();
var MeetingType        =   require('../../model/MeetingType-model');
var S                  =   require('string');
var async              =   require('async');
var Chance             =   require('chance');
var chance             =   new Chance();

router.post('/create', bodyParser, function(req, res) {
    var data    =   req.body;
    var admin   =   data.user;
    MeetingType.findOne({name:data.name}, function(err, meetingtype){
        if(!err && meetingtype){
            res.send({code:'00', message: 'meeting type already exist', data: meetingtype});
        }else{
            var type = new MeetingType(data);
            type.persist(admin, function(error, meetingtype_doc){
                if(error){
                    res.send({code:'00', message: 'success', data: meetingtype_doc});
                }else{
                    res.send({code:'06', message:'#meetingtypes.list.notallowed'});
                }
            })
        }
        
    });
});
router.post('/list', bodyParser, function(req, res) {
    MeetingType.find({}, function(err, meetingtypes){
        if(!err && meetingtypes){
            res.send({code:'00', message: 'success', data: meetingtypes});
        }else{
            res.send({code:'06', message:'#meetingtypes.list.notallowed'});
        }
        
    });
});
router.post('/search', bodyParser, function(req, res) {
    var data    =   req.body;
    var session =   data.session;
    var str =   JSON.stringify(data.search);
    str     =   S(str).replaceAll('@','.').s;
    str     =   S(str).replaceAll('#','$').s;
    str     =   S(str).replaceAll('&','#').s;
    //console.log('QUERY     1:  ', str);
    try{
        data.search =  JSON.parse(str);
    }catch(e){
        console.log('query already an object');
    }
    MeetingType.find(data.search, function(err, meetingtypes){
        if(!err && meetingtypes){
            res.send({code:'00', message: 'success', data: meetingtypes});
        }else{
            res.send({code:'06', message:'#meetingtypes.list.notallowed'});
        }
        
    });

});

handler.use('/meetingtype', router);
module.exports = handler;
