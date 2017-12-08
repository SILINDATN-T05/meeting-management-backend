
var async           =   require('async');
var TranHandler     =   require('./TranHandler');
var router          =   require('../comms/Router');
var Session         =   require('../../../model/Session-model');
var Org             =   require('../../../model/Organisation-model');
var User            =   require('../../../model/User-model');
var handler         =   new TranHandler();


/*
 payload = {
        //user: user,
        session: session,
        data: {
            whate ever data u want to send
        }
    }
    uri     = 'bank/list
    action  = null
    headers: null
 */
handler.processStep =   function(uri, headers, action, payload, callback){
    async.waterfall([
        function doSession(next) {
            Session.findOne({_id:payload.session}, function (err, session) {
                if(!err && session){
                    if(session.authenticated && session.authenticated === true){
                        next(null, session);
                    }else{
                        next("#org_handler.session.not_authenticated");
                    }
                }else{
                    next("#org_handler.session.invalid");
                }
            });
        },
        function doUser(session, next) {
            User.findOne({_id: session.user}, function (err, user) {
               if(!err && user){
                   next(null, user, session);
               }else{
                   next("#org_handler.user.invalid");
               }
            });
        },
        function doOrg(user, session, next) {
            Org.findOne({organisationName: session.organizationID},function (err, org) {
                if(!err && org){
                    next(null, org, user, session);
                }else{
                    next("#org_handler.org.invalid");
                }
            });
        },
        function doParams(org, user, session,next) {
            var req =   {
                body:{
                    session: session,
                    user:user
                },
                path: uri,
                //organizationID: org._id
            };
            var data = payload.data;
            data["organizationID"] = org.organisationName;
            next(null, data, req);
        }
    ],
    function (err, data, req) {
        if(!err && data && req){
            router.route(data, req, {json:function (data,err) {
                callback(err,data);
            }});
        }else{
            callback({code:'06', message:err})
        }
    });
};
module.exports  =   handler;
