
var express         =   require('express');
var router          =   express.Router();
var handler         =   express();
var logger          =   require('util');
var bodyParser      =   require('body-parser').json();
var User            =   require('../../model/User-model');
var Language        =   require('../../model/Language-model');
var helper             =   require('./../../application/context/tran_handler/helper/query_helper');
var audit_helper       =   require('./../../application/portal/helper/auditHelper');
var Org             =   require('../../model/Organisation-model');
var Role            =   require('../../model/Role-model');
var shortid            =   require('shortid');
var AuthDetail      =   require('../../model/AuthDetail-model');
var service         =   require('../../engine/HashService');
var user_helper     =   require('./helper/user_helper');
var configurations  =   require('../../engine/ConfigService');
var config  =  new configurations();
var Meeting            =   require('../../model/Meeting-model');
var MeetingItem        =   require('../../model/MeetingItem-model');
var Notification       =   require('../../model/Notification-model');
var S                  =   require('string');
var passwordSheriff    =   require('password-sheriff');
var PasswordPolicy     =   passwordSheriff.PasswordPolicy;
var async              =   require('async');
var Chance             =   require('chance');
var chance             =   new Chance();
var randomize = require('randomatic');
var moment = require('moment');
var charsets = passwordSheriff.charsets;

router.post('/create', bodyParser, function(req, res) {
    var data    =   req.body;
    var admin   =   data.user;
});
router.post('/list', bodyParser, function(req, res) {
    var data    =   req.body;
    var session =   data.session;
    Org.findOne({organisationName: session.organizationID}, function(err, org){
        if(!err && org){
            Meeting.find({}).populate('meetin_type','name').populate('meeting_items').exec(function(err, meetings){
                res.send({code:'00', message: 'success', data: meetings});
            });
        }else{
            res.send({code:'06', message:'#meeting.list.notallowed'});
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
    Org.findOne({organisationName: session.organizationID}, function(err, org){
        if(!err && org){
            Meeting.find(data.search).populate('meetin_type', 'name').populate('meeting_items').exec(function(err, meetings){
                res.send({code:'00', message: 'success', data: meetings});
            });
        }else{
            res.send({code:'06', message:'#user.list.notallowed'});
        }
    });

});

handler.use('/user', router);
module.exports = handler;
