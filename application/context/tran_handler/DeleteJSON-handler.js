
var TranHandler     =   require('./TranHandler');
var handler         =   new TranHandler();
var del            =   require('./trans_utils/DeleteJSON');
//uri, headers, action, payload,
handler.processStep =   function(uri, headers, action, payload, callback){
    del.delete(uri, headers, payload, function(err, result){
        return callback(err, result);
    });
};
module.exports  =   handler;
