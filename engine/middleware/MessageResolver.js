var Locale          =   require('../../model/Locale-model');
var Language        =   require('../../model/Language-model');
var PayloadBuilder  =   require('../../application/context/tran_handler/MessageBuilder');
var payloadBuilder  =   new PayloadBuilder();
var Org             =   require('../../model/Organisation-model');
var S               =   require('string');
var async           =   require('async');
var db_helper       =   require('../../application/setup/helper/db_helper');

module.exports  =   function(req, res, next){
    var user        =   req.body.user;
    var session     =   req.body.session;
    var hasUser     =   (session && user);

    res['render']   =   res.json;
    res['json']     =   function(data){
        var hasCode   =    data && data.message && S(data.message).startsWith('#');
          async.waterfall([
            //--------- VALIDATE USER
            function(cb){
                if(hasCode){
                    cb(null, S(data.message).chompLeft('#').s);
                }else{
                    cb(new Error('#response.invalid'));
                }
            },
            // --------- LOCATE ORG
            function(code, cb){
                var option  =   hasUser?{organisationName: session.organizationID}:{organisationName: 'SYSTEM'};
                Org.findOne(option, function(err, org){
                   if(!err && org){
                       cb(null, code, org);
                   }else{
                       cb(new Error('#response.invalid'));
                   }
                });
            },
            //----------FIND LANGUAGE
            function(code,org, cb){
                async.parallel({
                    user_lang: function(fn){
                        if(hasUser){
                            Language.findOne({_id:user.language}, function(err, lang){
                                fn(null, lang);
                            });
                        }else{
                            fn(null, null);
                        }
                    },
                    org_lang: function(fn){
                        var lang    =   null;
                        async.eachSeries(org.languages, function(i, fnn){
                          if(i.org_default){
                              Language.findOne({_id:i.language}, function(err, doc){
                                  lang      =   doc;
                                  fnn();
                              });
                          }  else{
                              fnn();
                          }
                        }, function _done(){
                            fn(null, lang);
                        })
                    }
                }, function clean(err, result){
                        var lang    =   result.user_lang || result.org_lang;
                        if(lang){
                            cb(null, code, lang, org);
                        }else{
                            cb(new Error('#org.lang.invalid'));
                        }
                })
            },
            //-----------PARSE CODE
            function (code, lang, org, cb){
                var query   =   [   {$match: { code:code, organizationID:org.organisationName}},
                                    {$unwind: '$message'},
                                    {$match: {"message.language":lang._id}}
                                    ];
                Locale.aggregate(query, function(err, result){
                    if(!err && result && result.length > 0){
                        cb(null, result.shift().message.text|| null);
                    }else{
                        db_helper.locateSystemAdmin(function(err, admin){
                            if(!err&& admin){
                                var locale              =   new Locale();
                                locale.code             =   code;
                                locale.organizationID   =   org.organisationName;
                                locale.message.push({language:lang, text:code});
                                locale.persist(admin, function(err, doc){
                                    cb(new Error('#query.failed'));
                                });
                            }else{
                                cb(new Error('#query.failed'));
                            }
                        });
                    }
                });
            },
            function (template, cb){
                payloadBuilder.buildMessageTemplate(data.data||{}, template, function(err, message){
                    cb(null, message|| template);
                })
            }
        ], function done(err, result){
            if(!err && result){
                data.message    =  result;
                res.render(data);
            }else{
                res.render(data);
            }
        });
    }
    next();
}