

var async        =   require('async');
var dataStore    =   require('./DataSore');
var Transaction  =   require('../../model/Transaction-model');
var _            =   require('underscore');
var manager      =   null;
//--------- CONFIG THIS ---------//
var min         =   3;
var max         =   6;

function ProcessBuffer() {

}
ProcessBuffer.prototype.init    =   function (process_manager, callback) {
    if(!_.isEmpty(process_manager))
    {
        manager =   process_manager;
        Transaction.find({status: "PROCESSING"}, function (err, refs) {
            if(!err && refs){
                async.forEachOf(refs, function (entry, index, cb) {
                    entry.remove(function () {
                        cb();
                    });
                }, function clean() {
                    callback();
                })
            }else{
                callback();
            }
        });
    }else {callback()}

}
ProcessBuffer.prototype.createNext =  function (process_name, callback) {
    var transaction =   new Transaction();
    transaction.save(function (err, transaction) {
        if(!err && transaction){
            var options =   {name:process_name, id:transaction.server_ref};
            manager.createProcess(options, function (err, process) {
                if(!err && process) {
                    dataStore.push(process_name, transaction, process, function () {
                        callback();
                    })
                }else{
                    callback(err);
                }
            });
        }
    });
}
ProcessBuffer.prototype._auto_push  =   function (times, process_name, callback) {
    var self    =   this;
    var coll    =   [];
    for(var i=0;i<times;i++){
        coll.push(i);
    }
    async.forEachOf(coll, function (p,i,next) {
        self.createNext(process_name, function () {
           next();
        });
    },function done() {
        callback();
    });
}
ProcessBuffer.prototype.nextProcess =   function (process_name, callback) {
    var self    =   this;
    dataStore.checkData(process_name,function(data)
    {
        if(_.isEmpty(data)||data=='undefined')
        {
            self.createNext(process_name,function(err,info)
            {
                createProcessesBuffer(process_name,self,callback)
            })
        }else {
            createProcessesBuffer(process_name,self,callback)
        }
        });
}

function createProcessesBuffer(process_name,self,callback)
{
    dataStore.shift(process_name, function (err, server_ref, process, size) {
        if(!err && server_ref && process){
            if(size < min){
                self._auto_push(max-size, process_name, function () {
                    console.log('---------SERVER----', max-size);
                });
            }
            callback(null, server_ref, process);
        }else{
            callback(err);
        }
    });

}
module.exports  =   new ProcessBuffer();
