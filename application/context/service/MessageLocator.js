
var Language        =   require('../../../model/Language-model');
var PayloadBuilder  =   require('../tran_handler/MessageBuilder');
var payloadBuilder  =   new PayloadBuilder();
var Message         =   require('../../../model/Locale-model');
var S               =   require('string');
var async           =   require('async');
var logger          =   require('winston');

var MessageLocator  =   function(){};

MessageLocator.prototype.locateMessage  =   function(data, user, callback){
    var self    =   this;
    if(data === undefined){
        data    =   {code:'06', message:'#service.response.invalid'};
    }
    if(!data || !data.message || !S(data.message).startsWith('#')){
        return callback(data);
    }
    var code    =   S(data.message).chompLeft('#').s;
    async.waterfall([
            function doFindDefaultLanguage(next) {
                self.locateDefaultLang( function (err, language) {
                    if (!err) {
                        next(null, language);
                    }
                    else {
                        next('#user.language.ntf', null);
                    }
                });
            },
           function doFindUserLanguage(language,next) {
              self.locateUserLang(user, function (err, language1) {
                   if (!err) {
                       next(null, language1);
                   }
                   else {
                       next(null,language);
                   }
               });
           },
        ],

        function done(err, result){
        if(err) {
            logger.error(err);
        }
        var locale    =   result;

        if(locale){
            var query   =   [{$match: { code:code.toLowerCase()}},
                    {$unwind: '$message'},
                    {$match: {'message.language':locale._id}}
                ];
            Message.aggregate(query, function(err, result){
                if(!err && result && result.length > 0){
                    data.message =  result[0].message.text|| data.message;

                    payloadBuilder.buildMessageTemplate(data.data, data.message, function(err, message){
                        if(!err && message){
                            data.message = message;
                        }

                        return callback(data);
                    });

                }else{
                    var message = new Message();
                    message.code = code;
                    message.message.push({language:locale, text:code});
                    if(user && user._id){
                        message.persist(user, function(){
                            return callback(data);
                        });
                    }else{
                        return callback(data);
                    }
                }
            });
        }else{
            return callback(data);
        }
    });
};
MessageLocator.prototype.locateDefaultLang  =   function(callback){
    Language.findOne({system_default:true}, function(err, lang){
        if(!err && lang){
            return callback(null, lang);
        }else{
            return callback('#org.default.language.invalid');
        }
    });
};
MessageLocator.prototype.locateUserLang  =   function(user, callback){
            Language.findOne({_id:user.language}, function(err, lang){
                if(!err && lang){
                    return callback(null, lang);
                }else{
                    return callback('#org.language.user.invalid');
                }
            });
};
module.exports  =   MessageLocator;
