
var S               =   require('string');
var fs              =   require('fs');
var TranHandler     =   require('./TranHandler');
var handler         =   new TranHandler();
var mongoose        =   require('mongoose');

handler.processStep =   function(uri, headers, action, payload, callback){
    var convpayload =   S(payload).replaceAll('quoteSign', '"').s;
    mongoose.connection.db.eval(convpayload, function(err, result) {
        if(!err)
        {
            callback(null, {code: '00', message: 'success', data: result});
        }else
        {
            callback(null, {code: '06', message: 'fail', data: err});
        }
    });
};
module.exports  =   handler;
