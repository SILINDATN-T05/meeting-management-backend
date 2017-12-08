
var log4js          =   require('log4js');
var ServiceHandler  =   require('./OrgServiceHandler');
var cluster         =   require('./Cluster');
var logger          =   log4js.getLogger('PROCESS_HELPER');
var args            =   process.argv;
var processName     =   undefined;
var managerTime     =   1000*10;

if(args.length >= 5){
    var service       =   {port:args[2]};
    processName       =    args[4];
    var handler           =   new ServiceHandler({
        service: service,
        database: args[3],
        name: processName
    });
    handler.startService();
    setInterval(function(){
        cluster.locateMaster(function(err, pid, pmid){
            if(!err && pmid){

            }else{
                logger.error('SERVICE SHUTING DOWN');
                cluster.killNamed(processName, function(){
                });
            }
        });
    }, managerTime);
}else{
    logger.fatal('INVALID ARGUMENT TO START A SERVICE');
}
