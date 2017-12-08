
var S           =   require('string');
var StepLogger  =   require('../../../model/TranStepLog-model');
var Config      =   require('../../../model/Configuration-model');
var Transaction  =   require('../../../model/SERVERTransaction-model');
var async       =   require('async');

function  PayloadBuilder(){

}
PayloadBuilder.prototype.buildPayload   =   function(data, template, callback, e){
    var payload                         =   JSON.stringify(data);
    var  self                           =   this;
    S.TMPL_CLOSE                        =   '}';
    self.buildTemplate(template.trans.server_ref, payload, function(err, payload){
        if(!err && payload){
            for(var name in template){
                //S.TMPL_OPEN     = '${'+name+'.';
                payload      =   S(payload).template(template[name], '${'+name+'.', '}').s;
            }
            try{
                payload = JSON.parse(payload);
            }catch(e){
                payload = payload;
            }
            return callback(null, payload);
        }else{
            return callback(err);
        }
    },e);
}
PayloadBuilder.prototype.buildTemplate   =   function(server_ref, payload, callback){
    S.TMPL_CLOSE    = '}';
    payload         =   JSON.stringify(payload);
    async.parallel({
        steps: function(next){
            StepLogger.find({server_ref: server_ref}, function(err, docs){
                next(null, docs);
            });
        },
        configs: function(next){
            Config.find({}, function(err, docs){
                next(null, docs)
            });
        },
        tran:function(next)
        {
            Transaction.findOne({server_ref: server_ref}, function(err, docs){
                next(null, docs);
            });
        }
    }, function read(err, result){
        S.TMPL_OPEN     =   '${trans.';
        payload         =   S(payload).template(result.tran).s;
        //var options = null;
        async.eachSeries(result.steps, function(doc, next){
            S.TMPL_OPEN     =   '${'+doc.step_name+'.';
            payload         =   S(payload).template(doc.step_data).s;
            //S.TMPL_OPEN     =   '${options.';
            //payload         =   S(payload).template(doc.req_options||{}).s;
            //
            //options=options?options:doc.req_options;
            next();
        }, function move() {
            //S.TMPL_OPEN     =   '${options.';
            //options=options?options:{};
            //payload         =   S(payload).template(options).s;
            async.eachSeries(result.configs, function(doc, next){
                //S.TMPL_OPEN     =   '${'+doc.name+'.';
                //payload         =   S(payload).template(doc.step_data).s;
                next();
            }, function done() {
                try{
                    payload = JSON.parse(payload);
                }catch(e){
                    payload = payload;
                }
                return callback(null, payload);
            });
        });
    });
}
PayloadBuilder.prototype.buildMessageTemplateUnique   =   function(options,server_ref, template, callback){
    var payload                         =   JSON.stringify(template);
    var self                            =   this;
    try{
        self.buildTemplate(server_ref,payload,function(err,data){
            async.forEachOf(options, function i(param, key, cb){
                data      =   S(data).template(param, '${'+key+'.', '}').s;
                cb();
            }, function done(){
                return callback(err,data);
            });
        })
    }catch(e){
        return callback(null, payload);
    }

}

module.exports  =   PayloadBuilder;
