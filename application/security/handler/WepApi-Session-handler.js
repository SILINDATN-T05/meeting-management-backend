

var async           =   require('async');
var Organisation    =   require('../../../model/Organisation-model');
var Application     =   require('../../../model/Application-model');
var Session             =   require('../../../model/Session-model');
var Router              =   require('../../../model/Router-model');
var Application         =   require('../../../model/Application-model');
var User                =   require('../../../model/User-model');
var serviceHandler      =   require('./Service-handler');
var serviceApiHandler      =   require('./ServiceApi-handler');
var serviceEqHandler    =   require('./ServiceEnquiry-handler');
var handler             =   require('./API-handler');
var ISOMParser          =   require('../../api_helper/ISOMParser');
var helper          =   require('../helper/AUTH-helper');
var config = require('./../../../engine/Config');

module.exports  =   function (req, res) {
    var data            =   req.body;
    //------- required for create session----
    var channel         =   config.webapi.channel;
    var organisationId  =   config.webapi.organizationID;
    var applicationCode =   config.webapi.application;
    var _session            =   '';
    var data                =   req.body;
    var action              =   'LOGIN';
    //--------- end required-----------
    var query           =   {channel: channel, organizationID: organisationId};
    //=============== VALIDATION ==============//
    async.waterfall([
        function doValidations(next) {
            if(!channel){
                next('#session.channel.missing');
            }else{
                if(!organisationId){
                    next('#session.organisation.missing');
                }else{
                     next();
                }
            }
        },
        function doOrganisation(next) {
            Organisation.findOne({organisationName: organisationId}, function(err, org){
                if(!err && org){
                    next(null, org);
                }else{
                    next('#session.organisation.invalid');
                }
            });
        },
        function doLanguages(org, next) {
            var languages   =   [];
            async.eachSeries(org.languages, function(lan, cb){
                Language.findOne({_id: lan.language}, function(err, language){
                    if(!err && language){
                        languages.push(language);
                    }
                    cb();
                });
            }, function done(){
                next(null, languages, org);
            });
        },
        function doChannel(languages, org, next) {
                query['code'] = applicationCode;
                next(null, 'ACTIVE', languages, org);
        },
        function doApplication(status, languages, org, next){
            Application.findOne(query, function (err, application) {
                if(!err && application){
                    next(null, status, application, languages, org);
                }else{
                    next('#session.application.invalid');
                }
            });
        },
        function doCreateSession(status, application, languages, org, next) {
            helper.createSession(channel, org, channel+application, application, function (err, token) {
                if(!err && token){
                    next(null, token);
                }else{
                    next(err);
                }
            });
        },
        function loadSession(token, next) {
            Session.findOne({token:token}, function (err, session) {
                if(!err && session){
                    _session = session;
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
            serviceApiHandler.handleAction(user, data, session, apllication, route, transactionManager, function(error, response){
                console.log(error, response)
            });
        }else{
            res.send({code: '06', message: err});
        }
    });
}