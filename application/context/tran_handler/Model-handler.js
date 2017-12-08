
var S               =   require('string');
var fs              =   require('fs');
var TranHandler     =   require('./TranHandler');
var helper          =   require('./helper/query_helper');
var handler         =   new TranHandler();
/*
   payload  =   {
        model: 'Bank',
        query:{
             owner:xyz,
             accountNumber: abc,
             default_account: true,
             bank:
        }
   }
 */
handler.processStep =   function(uri, headers, action, payload, callback){
    var pathFound = 0;
    if(payload && payload.model && payload.query) {
        var modelPath = __dirname+'/../../../model/' + payload.model + '-model';
        if (fs.existsSync(modelPath+'.js')) {
            pathFound = 1;
        }
        else {
            var modelPath = __dirname+'/../../../model/sub/' + payload.model + '-model';
            if (fs.existsSync(modelPath+'.js')) {
                pathFound = 1;
            }

        }
        if (pathFound===1) {
            var Model = require(modelPath);
            helper.prepare(payload.query, function (err, query) {
                if(!err && query){
                    if(payload.method){
                        delete query.__ttl;
                        Model.find(query, function (err, doc) {
                            if (!err && doc) {
                                callback(null, {code: '00', message: 'success', data: doc});
                            } else {
                                callback(null, {code: '06', message: '#model_handler.' + payload.model + '.data.ntf'});
                            }
                        });
                    }else {
                        Model.findOne(query, function (err, doc) {
                            if (!err && doc) {
                                callback(null, {code: '00', message: 'success', data: doc});
                            } else {
                                callback(null, {code: '06', message: '#model_handler.' + payload.model + '.data.ntf'});
                            }
                        });
                    }
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
