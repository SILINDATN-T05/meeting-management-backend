
var Flow        =   require('./../../../../model/TransactionFlow-model');
var S           =   require('string');
var helper      =   exports = module.exports = {};
var logger      =   require('winston');

helper.response_mapper    =   function(data, flow, callback){
    try{
        var str    =   S(data).collapseWhitespace().s;
        var value  =   JSON.parse(str);

        return callback(null, value);
    }catch(e){
        return callback('#trantype.create.requestmapper.invalid');
    }
};

helper.request_mapper    =   function(data, callback){
    try{
        var str    =   S(data).collapseWhitespace().s;
        var value  =   JSON.parse(str);

        return callback(null, value);
    }catch(e){
        logger.error(e.stack, data);

        return callback('#trantype.create.requestmapper.invalid');
    }
};

helper.locate_flow    =   function(id, callback){
            Flow.findOne({_id: id}, function(err, flow){
                if(!err && flow){
                  return callback(null, flow);
                }else{
                    return callback('#trans_type.create.flow.invalid');
                }
            });

};
module.exports  =   helper;
