

var async           =   require('async');
var Organisation    =   require('../../../model/Organisation-model');
var Application     =   require('../../../model/Application-model')
var helper          =   require('../helper/AUTH-helper');

module.exports  =   function (req, res) {
    var data            =   req.body;
    //------- required for create session----
    var channel         =   data.channel;
    var deviceId        =   data.deviceId;
    var organisationId  =   data.organizationID;
    var applicationCode =   data.application;
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
                    if(channel === 'APP' && !deviceId){
                        next('#session.device.missing');
                    }else{
                        next();
                    }
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
            helper.createSession(channel, org, deviceId, application, function (err, token) {
                if(!err && token){
                    next(null, {code: '00', message: 'success', token: token, status : status, languages:languages });
                }else{
                    next(err);
                }
            });
        }
    ],
    function done(err, result) {
        if(!err && result){
            res.send(result);
        }else{
            res.send({code:'06', message:err});
        }
    });
}
