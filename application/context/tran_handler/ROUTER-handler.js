
var TranHandler     =   require('./TranHandler');
var handler         =   new TranHandler();
/*
   YOU WILL HAVE TO PICK THE DATA FROM THE PREVIOUS
   STEP AND RETURN IT AS IT IS AND THEN EVALUATE
   WITHOUT BREAKING THE FLOW
   *** SPECIAL CASE
 */
handler.processStep =   function(uri, headers, action, payload, callback){
    return callback(null, payload);
};
module.exports  =   handler;
