
var router          =   exports = module.exports = {};
var caller          =   require('./client');
var Organisation    =   require('../../../model/Organisation-model');
var ProcessStore    =   require('../ProcStore');
var processRouter   =   new ProcessStore(null);
var async           =   require('async');

router.route    =   function(payload, req, res/*, after, override*/){
    var user            =   payload.user ||req.body.user;
    var path            =   payload.path||req.path;
    var session         =   payload.session ||req.body.session;

    //console.error('-------------ROUTER--------',path, payload,'-------------ROUTER END--------');
    async.waterfall([
            function checkParams(next) {
                if(session && session.organizationID){
                    next();
                    if(user && user._id){

                    }else{
                        next('#router.user.invalid');
                    }
                }else{
                    next('#router.session.invalid');
                }
            },
            function doOrg(next) {
                Organisation.findOne({organisationName: session.organizationID, system:'NO'}, function(err, org){
                    if(!err && org){
                        next(null, org);
                    }else{
                        next('#router.org.invalid');
                    }
                });
            },
            function doRoute(org, next) {
                processRouter.locateRoute(org.organisationName, function(err, route){
                    next(err, route);
                });
            }
        ],
        function (err, route) {
            if(!err && route){
                caller(route, path, user, payload, function(err, response){
                    if(!err && response){
                        res.json(response);
                    }else{
                        res.json({code:'06', message: err});
                    }
                });
            }else{
                res.json({code:'07', message: err});
            }
        });
};

module.exports = router;
