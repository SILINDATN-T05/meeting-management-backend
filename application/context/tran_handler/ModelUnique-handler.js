
var TranHandler     =   require('./TranHandler');
var helper          =   require('./helper/query_helper');
var handler         =   new TranHandler();

handler.processStep =   function(uri, headers, action, payload, callback){
    if(payload && payload.model && payload.query){
        var Model   =   require('./../../../model/'+payload.model+'-model');
        if(Model){
            helper.prepare(payload.query, function (err, query) {
                if(!err && query){
                    Model.find(query, function(err, docs){
                        if(!err && docs){
                            if(docs.length === 1){
                                callback(null, {code:'00', message:'success', data: docs.shift()});
                            }else{
                                callback(null, {code:'06', message:'#model_handler.'+payload.model+'.model.no_unique'});
                            }
                        }else{
                            callback(null, {code:'06', message:'#model_handler.'+payload.model+'.model.ntf'});
                        }
                    });
                }else{
                    callback(null, {code:'06', message:err});
                }
            })
        }else{
            callback(null, {code:'06', message:'#model_handler.'+payload.model+'.model.invalid'});
        }
    }else{
        callback(null, {code:'06', message:'#model_handler.'+payload.model+'.payload.invalid'});
    }

};
module.exports  =   handler;
