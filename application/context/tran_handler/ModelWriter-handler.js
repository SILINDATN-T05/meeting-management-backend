
var async           =   require('async');
var TranHandler     =   require('./TranHandler');
var User            =   require('../../../model/User-model');
var handler         =   new TranHandler();
var configurations  =   require('../../../engine/ConfigService');
var config  =  new configurations();
var passwordSheriff = require('password-sheriff');
var PasswordPolicy = passwordSheriff.PasswordPolicy;
var charsets = passwordSheriff.charsets;

/*
 payload  =   {
 model: 'Bank',
 user: user,
 query:{
 owner:xyz,
 accountNumber: abc,
 default_account: true,
 bank:
 }
 }
 */
handler.processStep =   function(uri, headers, action, payload, callback){
    try
    {
        payload = JSON.parse(payload);
    }catch (e)
    {

    }
    async.waterfall([
            function doUser(next) {
                /*User.find({_id:payload.user}, function (err, user) {
                 if(!err && user) {
                 next(null, user);
                 }else{
                 next('#model_writer.user.invalid');
                 }
                 });*/
                if(payload.user && payload.user._id){
                    next(null, payload.user);
                }else{
                    next('#model_writer.user.invalid');
                }
            },
            function doModel(user, next) {
                var Model   =   require('./../../../model/'+payload.model+'-model');
                if(Model){
                    next(null, Model, user);
                }else{
                    next('#model_handler.'+payload.model+'.model.invalid');
                }
            },
            function doSecurity(Model,user,next) {
                if(payload.model==="AuthDetail" && payload.query.channel ==="INTERNET_BANKING")
                {
                    config.locate("PASSWORDRULES",function(err,info)
                    {
                        var expressionsArr = [];

                        Object.keys(info.value).forEach(function (key,index) {

                            if(info.value[key])
                            {
                                switch (key)
                                {
                                    case "digits":
                                        expressionsArr.push(charsets.numbers);
                                        break;
                                    case "lowercase":
                                        expressionsArr.push(charsets.lowerCase);
                                        break;
                                    case "uppercase":
                                        expressionsArr.push(charsets.upperCase);
                                        break;
                                    case "symbols":
                                        expressionsArr.push(charsets.specialCharacters);
                                        break;

                                }

                            }
                        })
                        var policy = new PasswordPolicy({
                            length : {
                                minLength : info.value.length
                            },
                            containsAtLeast : {
                                atLeast : info.value.atLeast,
                                expressions : expressionsArr
                            }
                        });

                        if(policy.check(payload.query.hash))
                        {
                            next(null, Model, user);
                        }else
                        {
                            next("Password not valid");
                        }
                    });
                }else{
                    next(null, Model, user);
                }
            },
            function doCreate(Model, user, next) {
                for(var key in payload.query)
                {
                    if(payload.query.hasOwnProperty(key))
                    {
                        var rx = /(^{|}$)/;
                        if(typeof payload.query[key] === "string" && rx.test(payload.query[key]))
                        {
                           payload.query[key] = JSON.parse(payload.query[key])
                        }
                    }
                }
                var model = new Model(payload.query);
                model.persist(user, function (err, data) {
                    if ( err && err.code === 11000 ) {
                        next(null,user, {code:'06', message:'failed', data: "Record exists"});
                    }else if(err)
                    {
                        next(null,user, {code:'06', message:'failed', data: err});
                    }else
                    {
                        next(null,user, {code:'00', message:'success', data: data});
                    }
                });
            },
            function doUpdate(user,result, next) {
                if(payload.referenceModel)
                {

                    var Model   =   require('./../../../model/'+payload.referenceModel.model+'-model');
                    Model.findOne(payload.referenceModel.query, function (err, doc) {
                        if(!err && doc)
                        {

                            doc[payload.referenceModel.pushField].push(result.data._id);
                            doc.persist(user, function (err, data) {
                                if ( err && err.code === 11000 ) {
                                    callback(null, {code:'06', message:'failed', data: "Record exists"});
                                }else if(err)
                                {
                                    next(null, {code:'06', message:'failed', data: err});
                                }else
                                {
                                    callback(null, {code:'00', message:'success', data: data});
                                }
                            });
                        }else
                        {
                            callback(null, {code:'06', message:'failed', data: err});
                        }
                    });
                }else
                {
                    next(null,result);
                }
            }
        ],
        function (err, result) {
            if(!err && result){
                callback(null, result);
            }else{
                callback(null, {code:'06', message:err});
            }
        });
};
module.exports  =   handler;
