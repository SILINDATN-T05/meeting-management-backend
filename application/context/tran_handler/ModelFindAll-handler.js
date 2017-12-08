
var S               =   require('string');
var fs              =   require('fs');
var TranHandler     =   require('./TranHandler');
var helper          =   require('./helper/query_helper');
var handler         =   new TranHandler();

handler.processStep =   function(uri, headers, action, payload, callback){
    if(payload && payload.model && payload.query) {
        var modelPath = __dirname+'/../../../model/' + payload.model + '-model';
        if (fs.existsSync(modelPath+'.js')) {
            var Model = require(modelPath);
            helper.prepare(payload.query, function (err, query) {
                if(!err && query){
                    Model.find(query).sort({created: -1}).exec(function (err, doc) {
                        if (!err && doc) {
                            callback(null, {code: '00', message: 'success', data: doc});
                        } else {
                            callback(null, {code: '06', message: '#model_handler.' + payload.model + '.data.ntf'});
                        }
                    });
                }else{
                    callback(null, {code: '06', message: err});
                }
            });
        } else {
            callback(null, {code: '06', message: '#model_handler.' + payload.model + '.model.ntf'});
        }
    }else{
        callback(null, {code: '06', message: '#model_handler.' + payload.model + '.payload.invalid'})
    }
};
module.exports  =   handler;
