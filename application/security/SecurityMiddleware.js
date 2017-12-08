
var express             =   require('express');
var async               =   require('async');
var Session             =   require('../../model/Session-model');
var Router              =   require('../../model/Router-model');
var Application         =   require('../../model/Application-model');
var User                =   require('../../model/User-model');
var Organisation    =   require('../../model/Organisation-model');
var serviceHandler      =   require('./handler/Service-handler');
var serviceApiHandler   =   require('./handler/ServiceApi-handler');
var helper          =   require('./helper/AUTH-helper');
var serviceEqHandler    =   require('./handler/ServiceEnquiry-handler');
var handler             =   require('./handler/API-handler');
var ISOMParser          =   require('../api_helper/ISOMParser');
var moment              =   require('moment');
var server_handler = require('./../context/tran_handler/PostJSON-handler');
const querystring = require('querystring');
var config = require('./../../engine/Config');
var parseString = require('xml2js').parseString;
var router              =   express.Router();

function SecurityMiddleware() {

}
SecurityMiddleware.prototype.bind       =   function (context, transactionManager) {
    router.post('/createSession', require('./handler/Session-handler'));
    // router.post('/Token',    require('./handler/WepApi-Session-handler'));
    router.post('/endSession',    require('./handler/Cleanup-handler'));
    //-----  SERVICE API -------//
    router.post('/service',  function (req, res) {
        var _session            =   req.body.session;
        var data                =   req.body;
        var action              =   data.action;
        //--------------------ROUTE SERVICES--------------//
        async.waterfall([
                function loadSession(next) {
                    Session.findOne({_id:_session._id}, function (err, session) {
                        if(!err && session){
                            next(null, session)
                        }else{
                            next('#service.session.invalid');
                        }
                    });
                },
                function loadApplication(session, next) {
                    Application.findOne({_id:session.application}, function (err, application) {
                        if(!err && application){
                            next(null, application, session);
                        }else{
                            next('#service.session.application.invalid');
                        }
                    });
                },
                function loadRouter(application,session, next) {
                    var query   =   {action:action,application:application.code, channel:application.channel};
                    Router.findOne(query, function (err, route) {
                        if(!err && route){
                            next(null, route, application, session);
                        }else{
                            next('#service.route.invalid');
                        }
                    });
                },
                function doUser(route, application, session, next) {
                    if(route.authenticated && route.authenticated == true){
                        if(session.authenticated && session.authenticated===true){
                            User.findOne({_id:session.user}, function (err, user) {
                                if(!err && user){
                                    next(null, session, application,route, user);
                                }else{
                                    next('#service.route.auth.user.invalid');
                                }
                            });
                        }else{
                            next('#service.route.auth.required');
                        }
                    }else{
                        next(null, session, application,route, {});
                    }
                }
        ],
        function done(err, session, apllication, route, user){
            if(!err && session && apllication && route){
                if(data && data.server_ref && data.server_ref !=undefined){
                    serviceEqHandler.handleAction(data.server_ref, data, transactionManager, res);
                }else{
                    serviceHandler.handleAction(user, data, session, apllication, route, transactionManager, res);
                }
            }else{
                res.send({code: '06', message: err});
            }
        });
        //---------------------- END ENQUIRY--------------//
    });
    //-------- WS API
    context.use('/', router);
}
module.exports  =   new SecurityMiddleware();
