

var ResponseParser  =   require('./Response-parser');
var responseParser  =   new ResponseParser();

responseParser.parseResult  =   function(result, mapper, callback){
    if(typeof result == "string")
    {
        try{
            result = JSON.parse(result);
        }catch(e){
        }
    }
    if(result && result.code && result.message){
        callback(result);
    }else{
        callback({code:'00', message:'success', data: result});
    }
};

module.exports  =   responseParser;
