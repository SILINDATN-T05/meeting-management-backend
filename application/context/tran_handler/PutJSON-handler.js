
var TranHandler     =   require('./TranHandler');
var handler         =   new TranHandler();
var put            =   require('./trans_utils/PutJSON');
//uri, headers, action, payload,
handler.processStep =   function(uri, headers, action, payload, callback){
    put.put(uri, headers, payload, function(err, result){
        return callback(err, result);
    });
};
module.exports  =   handler;
