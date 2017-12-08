var Session     =   require('../../model/Session-model');
var S           =   require('string');

var ROUTES      =   {
    '':'CREATE_SESSION',
    '':'USER_LOGIN',
    '':'CREATE_ROLE',
    '':'CREATE_USER',
    '':'FIRST_TIME_LOGIN',
    '':'CHANGE_PASSWORD',
    '':'TRANSACTION',
    '':''
};

module.exports  =   function(req, res, next){
    var session        =   req.body.session;
    var action         =   req.path;
    if(session && req.method ==='POST'){
        Session.findOne({_id:session._id}, function(err, data){
            if(data){
               data.pushAction(action, function(){
                   next();
               });
            } else{
                next();
            }
        });
    }else{
        next();
    }
}