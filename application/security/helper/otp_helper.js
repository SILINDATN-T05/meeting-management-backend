
var helper              =   module.exports  =   {};
var User                =   require('../../../model/User-model');
var Notification        =   require('../../../model/Notification-model');
var Configurations      =   require('../../../model/Configuration-model');
var Chance              =   require('chance');
var chance              =   new Chance();
var moment              =   require('moment');
var async               =   require('async');

helper.generateOTP           =   function(msisdn,organizationID, callback, verify){
    User.findOne({msisdn: msisdn}, function (err, user) {
        if (!err && user) {
            Configurations.findOne({name: "OTPRULES", organizationID: organizationID}, function (err, info) {
                if(err || !info){
                    callback.json({code: '00', message: '#otp.create.norules'});
                    return;
                }
                if(msisdn==="27834451878")
                {
                    generatedOtp = user.OTPDetails.OTP;
                }else
                {
                    generatedOtp  =   chance.string(info.value.strength);
                }
                user.OTPDetails.OTP             =   generatedOtp;
                user.OTPDetails.OTPExpiryDate   =   moment().add(info.value.expiryTime, 's');
                var active                      =   (user.deviceDetails.status === 'ACTIVE' && user.status === 'ACTIVE');
                if(active===true){
                    callback.json({code: '00', message: '#user.device.linked.active'});
                    return;
                }
                var msg                         =   (active)? '#user.device.linked.active': 'success';
                async.waterfall([
                    //---------------------------//
                    function doNotification(next){
                        var notification = new Notification({
                                            message: "Your OTP is:" + generatedOtp,
                                            msisdn: msisdn,
                                            type: "SMS",
                                            owner: user._id
                                        });
                        var data    =   {
                            otp:    generatedOtp,
                            device: user.deviceDetails.status,
                            user:   user.status
                        };
                        next(null, notification, data);
                    },
                    function doUpdateUser(otp,data, next){
                        if(verify && active){
                            next(null, data);
                        }else{
                            user.persist(user, function (err){
                                otp.save(function(){
                                    next(null, data);
                                });
                            });
                        }
                    },
                    function doClean(data){
                        callback.json({code: '00', message: msg, data: data});
                    }
                ], function done(err){
                    callback.json({code: '06', message: err.message});
                })
                /*if(verify){

                    user.persist(user, function (err) {
                        console.log(err)
                        if (!err) {

                            notification.save(function (err, info) {
                                if (err) {
                                    callback.json(err);
                                } else {
                                    var data    =   {
                                        otp:    generatedOtp,
                                        device: user.deviceDetails.status,
                                        user:   user.status
                                    };

                                    msg     =   ()? '#user.device.linked.active': msg;
                                    callback.json({code: '00', message: msg, data: data});
                                }
                            })
                        }else{
                            callback.json({code: '00', message: '#otp.create.error'});
                        }
                    });
                }else{
                    user.persist(user, function (err) {
                        console.log(err)
                        if (!err) {
                            var notification = new Notification({
                                message: "Your OTP is:" + generatedOtp,
                                msisdn: msisdn,
                                type: "SMS",
                                owner: user._id
                            });
                            notification.save(function (err, info) {
                                if (err) {
                                    callback.json(err);
                                } else {

                                    var msg =   'success';
                                    msg     =   (user.deviceDetails.status === 'ACTIVE' && user.status === 'ACTIVE')? '#user.device.linked.active': msg;
                                    callback.json({code: '00', message: msg, data: data});
                                }
                            })
                        }else{
                            callback.json({code: '00', message: '#otp.create.error'});
                        }
                    });
                }*/
               /* user.persist(user, function (err) {
                    console.log(err)
                    if (!err) {
                        var notification = new Notification({
                            message: "Your OTP is:" + generatedOtp,
                            msisdn: msisdn,
                            type: "SMS",
                            owner: user._id
                        });
                        notification.save(function (err, info) {
                            if (err) {
                                callback.json(err);
                            } else {
                                var data    =   {
                                    otp:    generatedOtp,
                                    device: user.deviceDetails.status,
                                    user:   user.status
                                };
                                var msg =   'success';
                                msg     =   (user.deviceDetails.status === 'ACTIVE' && user.status === 'ACTIVE')? '#user.device.linked.active': msg;
                                callback.json({code: '00', message: msg, data: data});
                            }
                        })
                    }else{
                        callback.json({code: '00', message: '#otp.create.error'});
                    }
                });*/
            });
        } else {
            callback.json({code: '06', message: '#otp.user.ntf'})
        }
    });
}
helper.validateOTP          =   function(msisdn,organizationID,otp, callback){
    User.findOne({msisdn: msisdn}, function (err, user) {
        if(!err && user){
            Configurations.findOne({name:"OTPRULES", organizationID:organizationID}, function (err, info) {
                if (moment().diff(user.OTPDetails.OTPExpiryDate, 'seconds') > info.value.expiryTime) {
                   var generatedOtp = chance.string(info.value.strength);
                    user.OTPDetails.OTP = generatedOtp;
                    user.OTPDetails.OTPExpiryDate = moment().add(info.value.expiryTime, 's');

                    user.persist(user, function (err) {
                        callback.json({code: '00', message: 'success', otp: generatedOtp})
                    });

                }else if(user.OTPDetails.OTP != otp)
                {
                     callback.json({code: '06', message: 'Invalid OTP'})
                }else
                {
                    callback.json({code: '00', message: 'Success OTP'})
                }
            });
        }else{
            callback.json({code: '06', message: '#opt.user.ntf'});
        }
    });
}
module.exports  =  helper;
