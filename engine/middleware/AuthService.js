var express             =   require('express');
var async               =   require('async');
var S                   =   require('string');
var User                =   require('../../model/User-model');
var Session             =   require('../../model/Session-model');
var helper              =   require('../../engine/HashService');
var sanitizer           =   require('sanitizer');
var engine              =   exports = module.exports = {};

var openPaths           =   [   '/service','/endSession',
                                '/organisations/organisationName',
                                '/createOTP','/validateOTP',
                                '/portal/permission/organisations','/send', '/endSession'
                            ];
var noSessionPaths      =   [   '/createSession','/server/webservice','Token',
                            ];


engine.init = function(server){
    server.all('*',function(req, res, handle){
        var path        =   req.path;
        var body        =   req.body || {};
        async.waterfall([
                function doHeaders(next){
                    res.header('Access-Control-Allow-Credentials', 'true');
                    res.header("Access-Control-Allow-Origin", "*");
                    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
                    res.header("Access-Control-Allow-Headers", "X-Requested-With, content-type, x-access-token");//Authorization
                    next();
                },
                function doPath(next){
                  async.parallel({
                            open: function(cb){
                                var open    =   false;
                                async.forEachOf(openPaths, function(uri, i, _next){
                                    if(S(path).contains(uri)){
                                        open    =   true;
                                    }
                                    _next();
                                }, function _done(){
                                    cb(null, open);
                                })
                            },
                            no_session: function(cb){
                                var open    =   false;
                                async.forEachOf(noSessionPaths, function(uri, i,  _next){
                                    if(S(path).contains(uri)){
                                        open    =   true;
                                    }
                                    _next();
                                }, function _done(){
                                    cb(null, open);
                                })
                           }
                      },
                      function __done(err, result){
                          next(err, result.open, result.no_session);
                  });
                },
                function doSession(open, no_session, next){
                    if(no_session){
                        next();
                    }else{
                        helper.verify(req.headers['x-access-token'], function(err, token){
                            if(!err && token){
                                Session.findOne({_id:token}, function(err, session){
                                    if(!err && session){
                                        session.updateTTL();
                                        if(session.authenticated || open){
                                            body['session']   =   session;
                                            if(session.authenticated){
                                                User.findOne({_id:session.user}, function(err, user){
                                                    if(!err && user){
                                                        body['user'] = user;
                                                        next();
                                                    }else{
                                                        next(new Error('#server.session.user.missing'));
                                                    }
                                                });
                                            }else{
                                                next();
                                            }
                                        }else{
                                            next(new Error('#server.session.unauthorized'));
                                        }
                                    }else{
                                        next(new Error('#server.session.expired'));
                                    }
                                });
                            }else{
                                next(new Error('#server.session.token.invalid'));
                            }
                        });
                    }
                }
            ],
            function done(err, result){ 
                if(!err){
                    if(!body.session){
                        body['session'] =   {channel: body.channel, application:body.application}
                    }
                    req.body=   body;
                    req.body.session.session_actions =[]; //after too many reqeust server booms out entity to large error
                    handle();
                }else{
                    res.json({code:'49', message: err.message, data:{path: sanitizer.sanitize(path)}});//'#server.session.expired'
                }
            });
    });
}
module.exports  =  engine;
