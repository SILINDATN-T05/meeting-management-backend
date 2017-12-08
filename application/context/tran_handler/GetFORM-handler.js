
var TranHandler     =   require('./TranHandler');
var handler         =   new TranHandler();
var get            =   require('./trans_utils/GetForm');
                                //uri, headers, action, payload,
handler.processStep =   function(uri, headers, action, payload, callback){
    get.get(uri, headers, function(err, result){
        return callback(err, result);
    });
}
module.exports  =   handler;