var express                 =   require('express');
var router                  =   express.Router();
var setup_core              =   express();
var bodyParser              =   require('body-parser').json();
var ProcessManager          =   require('../context/ProcessManager');
var manager                 =   new ProcessManager();
var db_helper               =   require('./helper/db_helper');
var conf_helper             =   require('./helper/config_helper');
var localeJson              =   require('../../model/plugins/Locale-JSON-Model');
//-tk var SetupMsg                =   require('./SetupMsg.json');
var async                   =   require('async');

var params                  =   ['channel', 'application', 'dbHost', 'adminMsisdn',
                                    'dbName', 'adminPassword', 'dbHostPort',
                                    'language_code', 'language_name', 'username'
                                ];

router.post('/setup/init', function (req, res) {
    var code = localeJson.SetupErrorCode.code.SERVER_REQUIRES_SETUP.code;
    var message = localeJson.SetupErrorCode.code.SERVER_REQUIRES_SETUP.message;
    var description = localeJson.SetupErrorCode.code.SERVER_REQUIRES_SETUP.description;
    //res.send({"code": '57', "message": 'SERVER Requires initial setup'});
    res.send(code, message, description);
});
router.post('/setup/main', function (req, res) {
    var setupInitErr    =   localeJson.SetupErrorCode.code.setup_init_invalid;
    var payload         =   req.body;
    payload.dbHostPort  =   payload.dbHostPort || '27107';
    async.waterfall([
        function doValidation(next){
            var err =   null;
            async.forEachOf(params, function(param, i, cb){
                err =   err?err:(payload[param] !=undefined)?null: setupInitErr.code +param;
                cb();
            }, function _done(){
                next(err? new Error(err): null);
            });
        },
        function isSetupFromPortal(next){
            var setupNotAllowed = localeJson.SetupErrorCode.code.setup_init_application_not_allowed;
            next((payload.channel === 'PORTAL')?null: new Error(setupNotAllowed.code));
        },
        function tempConfig(next){
            var user    =   {
                msisdn:             payload.adminMsisdn,
                firstName:          payload.admin_fname||'Admin',
                lastName:           payload.admin_lname||'Admin',
                username:           payload.username||'admin',
                status:             'ACTIVE',
                passwordDetails:    {
                    hash:   payload.adminPassword,
                    status: 'ACTIVE'
                }
            };
            var language =   {
                name: payload.language_name,
                code:payload.language_code
            };
            var application =   {
                name: payload.application,
                code: payload.application,
                channel:    'PORTAL',
                description:'SERVER Portal'
            };
            var org         =   {
                organisationName:'SYSTEM',
                system:'YES'
            };
            next(null, {application: application, user:user, language: language, org:org});
        },
        function isAuth(config, next){
            next(null, config, (payload.auth &&  payload.auth=== true));
        },
        function doConn(config, auth, next){
            db_helper.createConn(auth, payload,  function(err, conn){
                if(!err && conn){
                    next(null, config, conn);
                }else{
                    next(new Error(err));
                }
            });
        },
        function saveTempConfig(config, conn, next){
            conf_helper.createTempConfig(config, conn, function(err){
                if(err){
                    next(new Error(err));
                }else{
                    next();
                }
            });
        }],
        function done(err){
            if(!err){
                res.send({'code': '00', 'message': 'success'});
                manager.reloadSERVER();
            }else{
                res.send({'code': '06', 'message': err.message});
            }
        });
});
setup_core.use('/', router);
setup_core.on('mount', function (parent) {
    console.error('SETUP LOADED');
});
module.exports = setup_core;
