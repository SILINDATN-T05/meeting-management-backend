var express         = require('express');
var S               = require('string');
var router          = require('./context/comms/Router');
var Org             = require('../model/Organisation-model');
var application     = express();
var manager         = null;
/*
    HANDLES SIMPLE ROUTES,
    WHICH DOES NOT REQUIRED ANY PRE-PROCESSING ON THE SECURITY
    MODULE,I.E TRANSACTION, CRUD ON THE ORG, ETC
 */
application.all('*', function(req, res, next) {
    if(req.method !== 'POST') {
        res.send({
            code: '48',
            message: '#server.method.notallowed'
        });

        return;
    }
    var path        = req.path;
    var session     = req.body.session;
    var user        = req.body.user;
    var data        = req.body;
    var isOpen      = S(path).contains('/location/processLocations');
    if(isOpen) {
        Org.findOne({
            organisationName: data.organizationID
        }, function(err, org) {
            if(!err && org) {
                var request = {
                    body: {
                        user: user
                    }
                };
                data.organizationID = org._id;
                data.path = path;
                router.route(data, request, res);
            }else{
                res.send({
                    code: '06',
                    message: '#server.route.user.invalid_entry'
                });
            }
        });
    }else{
        if(!user || !session) {
            res.send({
                code: '06',
                message: '#server.route.user.required'
            });

            return;
        }
        router.route(data, req, res);
    }
});
application.on('mount', function(parent) {
    manager = parent.get('ORG_MANAGER');
    manager.startAll();
});
module.exports = application;
