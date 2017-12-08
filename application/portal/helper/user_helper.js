
var User                    =   require('../../../model/User-model');
var helper                  =   exports = module.exports = {};

helper.validateCreateRequest     =   function(payload, callback){
    if(!payload.msisdn){
        return callback('user.create.msisdn.required');
    }
    if(!payload.firstName){
        return callback('user.create.firstname.required');
    }
    if(!payload.lastName){
        return callback('user.create.lastname.required');
    }
    User.findOne({msisdn: payload.msisdn}, function(err, user){
        if(user){
            return callback('user.create.msisdn.exist');
        }else{
            return callback();
        }
    });
};
helper.createUser  =   function(data, admin, callback){
    var user                =   new User(data);
    user.persist(admin, function(err, doc){
        return callback(err, doc);
    });
};
module.exports  =   helper;
