
var TranHandler     =   require('./TranHandler');
var handler         =   new TranHandler();
var post            =   require('./trans_utils/Send-GET-JSON-QS');

handler.processStep =   function(uri, headers, action, payload, callback){
    try{
        post.post(uri, '', payload, function(err, result){
            if(err){
                return callback(err);
            }else{
                return callback(null, result);
            }
        });
    }catch(e){
        return callback(e);
    }
};

module.exports  =   handler;
