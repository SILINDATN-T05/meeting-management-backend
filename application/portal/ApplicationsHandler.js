
var express         =   require('express');
var router          =   express.Router();
var handler         =   express();
var logger          =   require('util');
var bodyParser      =   require('body-parser').json();
var Application     =   require('../../model/Application-model');
var Org             =   require('../../model/Organisation-model');
var Role            =   require('../../model/Role-model');
var option          =   {channel:{$ne:'PORTAL'}};
var org_router      =   require('../../application/context/comms/Router');

var validateApplication =   function(payload, callback){
    if(!payload.name){
        return callback('#application.create.name.required');
    }
    if(!payload.code){
        return callback('#application.create.code.required');
    }
    if(!payload.channel_name){
        return callback('#application.create.channel.required');
    }
    Application.findOne({code:payload.code}, function(err, app){
        if(!err && app){
            return callback('#application.create.code.used');
        }else{
            Org.findOne({_id: payload.organisation}, function(err, org){
                if(!err && org){
                    return callback(null, org);
                }else{
                    return callback('#application.create.organisation.required');
                }
            });
        }
    });
};
router.post('/create', bodyParser, function(req, res) {
    var payload     =   req.body;
    var user        =   payload.user;
    validateApplication(payload, function(err, org){
        if(err) {
            res.send({code:'06', message:err});
            return;
        }
        var application             = new Application();
        application.name            =   payload.name;
        application.code            =   payload.code;
        application.description     =   payload.description;
        application.channel         =   payload.channel_name;
        application.organizationID  =   org.organisationName;
        var permissions             =   payload.permissions||[];
        console.error('___CREATE_APPLICAT', JSON.stringify(payload));
        for(i=0; i<permissions.length; i++){
            application.permissions.push(permissions[i]);
        }
        var trans_code             =   payload.trans_code||[];
        for(i=0; i<trans_code.length; i++){
            var trans   =   trans_code[i];
            application.trans_code.push({code:trans.code, name:trans.name});
        }
        application.persist(user, function(err, app){
            if(!err && app){
                res.send({code:'00', message:'success', data:app});
            }else{
                res.send({code:'06', message:'#application.create.error'});
            }
        });
    });
});
router.post('/list_all', bodyParser, function(req, res) {
    Application.find(option, function(err, apps){
        res.send({code:'00', message:'success', data:apps});
    });
});
router.post('/list_org', bodyParser, function(req, res) {
    var payload =   req.body;
    var org     =   payload.organizationID;
    Application.find({organizationID: org, channel:{$ne:'PORTAL'}}, function(err, apps){
        if(!err){
            res.send({code:'00', message:'success', data:apps});
        }else{
            res.send({code:'06', message:err});
        }
    });
});
router.post('/update_permissions', bodyParser, function(req, res) {
    var data        =   req.body;
    var user        =   data.user;
    var org         =   data.organizationID;//app organisation
    var app         =   data.application;   //app _id
    var permissions =   data.permissions;   //permissions array, IDs

    Application.findOne({_id:app, organizationID: org}, function(err, application){
        if(application){
            application.permissions =   permissions;
            application.persist(user, function(err){
                if(err){
                    res.send({code:'06', message:err.message});
                }else{
                    res.send({code:'00', message:'success'});
                }
            });
        }else{
            res.send({code:'06', message:'#application.update.invalid'});
        }
    });
});
router.post('/application_trans', bodyParser, function(req, res) {
    var data        =   req.body;
    var payload     =   {organizationID:data.organisation, path:'core/transType/map'};
    org_router.route(payload, req, res, undefined, data.organisation);
});
handler.use('/application', router);
module.exports = handler;
