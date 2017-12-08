
var TranHandler     =   require('./TranHandler');
var handler         =   new TranHandler();
var post_simple     =   require('./trans_utils/SOAPPost');
var logger          =   require('winston');

var cleanPayload    =  function(payload, uri, callback){
    var post        =  post_simple;
    try{
        callback(null, payload.replace(/\\/g, ''), post);
    }catch(e){
        callback(null, payload, post);
    }
};

handler.processStep =   function(uri, headers, action, payload, callback){
    cleanPayload(payload, uri, function(err, payload, schem){
        if(err) {
            logger.error(err);
        }
        schem.post(uri, headers, action, payload, function(err, result){
            return callback(err, result);
        });
    });
};


module.exports  =   handler;
