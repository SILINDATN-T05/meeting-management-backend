
var async           =   require('async');
var TranHandler     =   require('./TranHandler');
var User            =   require('../../../model/User-model');
var helper          =   require('./helper/query_helper');
var fs              =   require('fs');
var handler         =   new TranHandler();
var service         =   require('../../../engine/HashService');
var configurations  =   require('../../../engine/ConfigService');
var config  =  new configurations();
var passwordSheriff = require('password-sheriff');
var PasswordPolicy = passwordSheriff.PasswordPolicy;
var charsets = passwordSheriff.charsets;

//var router = require('../../context/comms/Router');
/*
 payload  =   {
 model: 'Customer',
 user: user_id,
 query: {msisdn:1233}
 update:{
 msisdn:    new_msisdn,
 name:      new_name
 }
 }
 */
handler.processStep =   function(uri, headers, action, payload, callback){
    async.waterfall([
            function doUser(next) {
                /*User.findOne({_id:payload.user}, function (err, user) {
                 if(!err && user) {
                 next(null, user);
                 }else{
                 next('#model_updater.user.invalid');
                 }
                 });*/
                if(payload.user && payload.user._id){
                    next(null, payload.user);
                }else{
                    next('#model_updater.user.invalid');
                }
            },
            function doModel(user, next) {
                var pathFound = 0;
                if(payload && payload.model && payload.query) {
                    var modelPath = __dirname + '/../../../model/' + payload.model + '-model';
                    if (fs.existsSync(modelPath + '.js')) {
                        pathFound = 1;
                    }
                    else {
                        var modelPath = __dirname + '/../../../model/sub/' + payload.model + '-model';
                        if (fs.existsSync(modelPath + '.js')) {
                            pathFound = 1;
                        }

                    }
                    if (pathFound === 1) {
                        var Model = require(modelPath);
                        if (Model) {
                            next(null, Model, user);
                        } else {
                            next('#model_handler.' + payload.model + '.model.invalid');
                        }
                    }else {
                        next('#model_handler.' + payload.model + '.model.invalid');
                    }
                }
            },
            function doQuery(Model, user, next) {
                if(payload.query){
                    helper.prepare(payload.query, function (err, query) {
                        next(err,query , Model, user);
                    });
                }else{
                    next('#model_updater.query.invalid');
                }
            },
            function compareAuthhistory(query, Model, user, next) {
                if(payload.model==="AuthDetail" && payload.update.hash && payload.action=='HASH')
                {
                    Model.findOne(query,function(err,data){
                        if(!err && data){
                            async.forEachOf(data.auth_history, function(value, key, cb){
                                    var days = moment(value.change_date).diff(moment(), 'days')*-1;

                                    if(days<=365){
                                        service.compare(payload.update.hash, value.previousHash, function (err, isMatch) {
                                            if (!err && isMatch === true) {
                                                next("Password already used. please try again");
                                            }else{
                                                cb();
                                            }
                                        })
                                    }else {
                                        cb();
                                    }
                                },
                                function close() {
                                    service.compare(payload.update.hash, data.hash, function (err, isMatch) {
                                        if (!err && isMatch === true) {
                                            next("Password already used. please try again");
                                        }else{
                                            next(null, query, Model, user)
                                        }
                                    })
                                })
                        }else{
                            next('data.query.not.found');
                        }
                    });
                }else{
                    next(null,query , Model, user);
                }
            },
            function doSecurity(query, Model,user,next) {
                if(payload.model==="AuthDetail" && payload.update.hash && payload.action=='HASH')
                {
                    config.locate("PASSWORDRULES_"+payload.query.channel,function(err,info)
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
                        if(policy.check(payload.update.hash))
                        {
                            service.encrypt(payload.update.hash, function (err, hash) {
                                if (!err && hash) {
                                    payload.update.hash = hash;
                                    next(null, query, Model, user);
                                } else {
                                    next(err);
                                }
                            })
                        }else
                        {
                            next("Password not valid");
                        }
                    });
                }else{
                    next(null,query , Model, user);
                }
            },
            function doUpdate(query, Model, user, next) {

                Model.findOne(query,function(err,data){

                    if(!err && data){
                        if(data.channel!=undefined && data.channel=='PORTAL'){
                            if(data.auth_history.length<=11) {
                                data.auth_history.push({
                                    previousHash: data.hash,
                                    change_date: moment().format("YYYY-MM-DD HH:mm"),
                                    reason: moment().format("YYYY-MM-DD HH:mm"),
                                    channel: data.channel
                                })
                            }else{
                                var dates = data.auth_history;
                                dates = data.auth_history.sort(function(a,b){
                                    return Date.parse(a.change_date) > Date.parse(b.change_date);
                                });
                                dates.pop();
                                dates.push({
                                    previousHash: data.hash,
                                    change_date: moment().format("YYYY-MM-DD HH:mm"),
                                    reason: moment().format("YYYY-MM-DD HH:mm"),
                                    channel: data.channel
                                });
                                data.auth_history = dates;
                            }
                        }
                        async.forEachOf(payload.update, function(value, key, cb){
                            var n= key.indexOf("$");
                            if (n>0) {
                                key1 = key.substring(0,n);
                                key2 = key.substring(n+1);
                                var temp = data[key1];
                                temp[key2] = value;
                                data[key1] = temp;
                            }
                            else {
                                try
                                {
                                    data[key] = JSON.parse(value);
                                }catch (e)
                                {
                                    data[key] = value;
                                }
                            }

                            cb()
                        },function done(){
                            if(payload.model==="File" || payload.model==="OnceOffTransactions" || payload.model==="ScheduleTransactions")
                            {
                                if (data.ApprovalHistory) {
                                    for (var i = 0; data.ApprovalHistory.length > i; i++) {
                                        if (data.ApprovalHistory[i].userApproval === payload.customer) {
                                            return next({code: '06', message: "#already.approved"});
                                        }
                                    }
                                }
                                if(user._id == data.createdBy)
                                {
                                   return next({code:'06', message:"#user.not allowed"});
                                }else
                                {
                                    var approvals = {
                                        userApproval : user,
                                        approvalDateTime : new Date(),
                                        approvalsNeeded : data.approvalsNeeded,
                                        approvalsCompleted : (parseInt(data.approvalsCompleted)+1).toString()
                                    }
                                    data.ApprovalHistory.push(approvals);
                                }

                            }
                            data.persist(user, function (err, data) {
                                if(!err)
                                {
                                    next(err, {code:'00', message:'success', data: data});
                                }else
                                {
                                    next({code:'06', message:err});
                                }
                            });
                        })
                    }else{
                        next(err);
                    }
                });
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
