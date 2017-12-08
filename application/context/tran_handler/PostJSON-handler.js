
var TranHandler     =   require('./TranHandler');
var handler         =   new TranHandler();
var post            =   require('./trans_utils/PostJSON');
                                //uri, headers, action, payload,
handler.processStep =   function(uri, headers, action, payload, callback){
    post.post(uri, headers, payload, function(err, result){
        return callback(err, result);
    });
};
module.exports  =   handler;
