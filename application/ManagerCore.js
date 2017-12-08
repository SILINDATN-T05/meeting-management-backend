var express = require('express');
var async = require('async');
var Org = require('../model/Organisation-model');
var ProcessStore = require('../application/context/ProcStore');
var application = express();
var router = express.Router();
var manager = new ProcessStore();
/*
    THIS IS ON FOR PROCESS MANAGER
 */
router.post('/manager', function(req, res) {
    var data    = req.body;
    var action  = data.action;
    var user    = req.body.user;
    var session = req.body.session;
    //---------------------------------------//
    async.waterfall([
        function doOrg(next) {
            Org.findOne({
                _id: session.organisation,
                system: 'YES'
            }, function(err, org) {
                if(!err && org) {
                    next(null);
                }else{
                    next('#manager.user.org.permission.invalid');
                }
            });
        },
        function doAction(next) {
            switch(action) {
            case'list':
                {
                    manager.list(function(err, data) {
                        if(!err && data){
                            next(null, data);
                        }else{
                            next('#error');
                        }
                    });
                }
                break;
            case'detail':
                {
                    manager.locateByName(data.name, function(err, data) {
                        if(!err && data){
                            next(null, data);
                        }else{
                            next('#error');
                        }
                    });
                }
                break;
            case'start':
                {
                    manager.updateStatus(data.name, 'SCHEDULED', function(err) {
                        if(err) {
                            next('#error');
                        }
                        next(null, {});
                    }, user, ' WEB UI');
                }
                break;
            case'stop':
                {
                    manager.updateStatus(data.name, 'STOPPED', function(err) {
                        if(err) {
                            next('#error');
                        }
                        next(null, {});
                    }, user, 'WEB UI');
                }
                break;
            case'cluster':
                {
                    manager.cluster(data.name, data.cluster, function(err) {
                        if(err) {
                            next('#error');
                        }
                        next(null, {});
                    }, user, 'WEB UI');
                }
                break;
            default:
                next('#manager.action.invalid');
            }
        }
    ],
        function done(err, result) {
            if(!err && result) {
                res.send({code: '00',message: 'success',data: result});
            }else{
                res.send({code: '06',message: err});
            }
        });
});
application.use('/', router);
module.exports = application;