
var Server                      =   require('./comms/server');
var format                      =   require('util').format;
var log4js                      =   require('log4js');
var Processor                   =   require('../process/TransactionProcessor');
var LocaleHandler               =   require('./handlers/LocaleHandler');
var TransactionTypes            =   require('./handlers/TransactionTypesHandler');
var TransactionTemplate         =   require('./handlers/TransactionTemplateHandler');
var TransactionFlow             =   require('./handlers/TransactionFlowHandler');
var TransactionFlowStep         =   require('./handlers/TransactionFlowStepHandler');
var TranStepLog                 =   require('./handlers/TranStepLogHandler');
var TransactionHandlerPortal    =   require('./handlers/TransactionHandlerPortal');
var ConfigHandler               =   require('./handlers/ConfigHandler');
var DbService                   =   require('../../engine/DbService');
var tranType                    =   require('../../model/TransactionType-model');
var config = require('./../../engine/Config');
var transactionTypes        =   new TransactionTypes();
var transactionTemplate     =   new TransactionTemplate();
var transactionFlow         =   new TransactionFlow();
var transactionFlowStep     =   new TransactionFlowStep();
var tranStepLog             =   new TranStepLog();
var localeHandler           =   new LocaleHandler();
var transactionHandlerPortal        =   new TransactionHandlerPortal();
var configHandler                   =   new ConfigHandler();
var server                          =   new Server();
var logger                          =   log4js.getLogger('ORG_SERVICE_HANDLER');
var async       =   require('async');
var _ = require('lodash');
var pusage = require('pidusage');
var pm2             =   require('pm2');
var pmx = require('pmx').init({
    http : true,
    errors : true,
    custom_probes : true,
    transactions  : true,
    network       : true,  // Network monitoring at the application level
    ports         : true,  // Shows which ports your app is listening on (default: false)
  });
var getCPU = function(){
    pm2.list(function(err, processes){
        var found = _.findIndex(processes, {name:config.webapi.organizationID});
        if(found>=0){
            pusage.stat(processes[found].pid, function (err, stat) {
                   //console.log('Pcpu: %s', stat.cpu)
                   //console.log('Mem: %s', stat.memory) //those are bytes
                    return stat.cpu;
                   })
        }else{
            return 0;
        }
    })
}

var probe = pmx.probe();

var metric = probe.metric({
    name  : 'CPU usage',
    value : function() {
      return getCPU();
    },
    alert : {
      mode  : 'threshold',
      value : 80,
      msg   : 'Detected over2% CPU usage', // optional
      action: function() { //optional
        console.error('Detected over 2% CPU usage');
      },
      cmp   : function(value, threshold) { //optional
        return (parseFloat(value) > threshold); // default check
      }
    }
  });
//===========handle errors========
process.on('uncaughtException', function (err) {
    logger.fatal('PROCESS ERROR, UNCAUGHT:', err);
});
var OrgServiceHandler = function(params){
    this.org_dboptions    =   params;
};
//================= HANDLERS========================//
server.all(function(user, req, res){
    res.send({code:'06', message:'#service.target.invalid'});
});

var startDbConnection   =   function(dbConf, callback){
    (new DbService(dbConf)).openConnection(function (err, isConnected, org_dboptions) {
        if(!err && isConnected){
            callback(null, org_dboptions);
        }else{
            callback(function(err) {
                if(err) {
                    return'#process.engine.db.conn.failed';
                }
            }, org_dboptions);
        }
    });
};
OrgServiceHandler.prototype.startService    =   function(){
    var port    =   this.org_dboptions.service.port;
    var dbConf  =   JSON.parse(this.org_dboptions.database);
    var name    =   this.org_dboptions.name;
    startDbConnection(dbConf, function(err, org_dboptions){
        if(err){
            logger.fatal(format('FAILED TO LOAD ORG [%s]', name), err);
        }else{
            var processor   =   new Processor(org_dboptions);
            tranType.find({},function(err,info)

            {
                async.forEachOf(info, function (entry, index, cb) {
                    processor.startTransaction({},entry,{},{},{},{},{},function(err,info)
                    {
                        cb();
                    })
                }, function clean() {
                    logger.info("---Org Process Buffer has been initialized---");
                })
            })
            server.setProperty('trans_processor', processor);
            server.handle('auth',               require('./handlers/AuthHandler'));
            server.handle('transaction',        require('./handlers/TransactionHandler'));
            server.handle('transaction_enq',    require('./handlers/TransactionEnquiryHandler'));
            server.handle('tranHandlerHan',     require('./handlers/TransactionHandlerHandler'));
            server.handle('language',           require('./handlers/LanguageHandler'));
            server.handle('transType',          transactionTypes);
            server.handle('transTemplate',      transactionTemplate);
            server.handle('transFlow',          transactionFlow);
            server.handle('transFlowStep',      transactionFlowStep);
            server.handle('message',            localeHandler);
            server.handle('tranStepLog',        tranStepLog);
            server.handle('transaction_prt', transactionHandlerPortal);
            server.handle('config', configHandler);
            server.startUp(port, name);
        }
    });
};
module.exports  =   OrgServiceHandler;
