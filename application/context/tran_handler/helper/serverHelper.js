
var SERVER         =  exports = module.exports = {};
var post            =   require('./PostUtil');
var util            =   require('util');
var async           =   require('async');

SERVER.comparePasswords  =   function(msisdn, pin, callback){
    var payload  =   {
        url: 'http://172.28.66.16:8080/app/Demo1',
        headers: {'Content-Type': 'application/json'},
        timeout: 30000,
        form:{msisdn:msisdn,pin:pin,tranType:"pinCheck"}
    }
    post.post(payload, function(err, response){
        return callback(response.data.code, response.data.message);
    });
}
module.exports  =  SERVER;
