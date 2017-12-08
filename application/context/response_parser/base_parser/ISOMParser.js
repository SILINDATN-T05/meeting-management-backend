
var mapper          =   {
    0:      'message_type',
    1:      'msisdn',
    2:      'processing_code',
    3:      'amount',
    4:      'charge_amount',
    5:      'transaction_date',
    7:      'system_id',
    303:    'available_amount',
    39:     'code',
    48:     'message',
    50:     'value',
    20:     'trans_id',
    37:     'everest_ref',
    416:    'token'
};
var async           =   require('async');
var xml2js          =   require('xml2js');
var log4js              =   require('log4js');
var options         =   {explicitArray: false, tagNameProcessors:[xml2js.processors.stripPrefix]};
var ConfigService   =   require('../../../../engine/ConfigService');
var configService   =   new ConfigService();
var logger          =   log4js.getLogger('ISOM_PARSER');

var ISOMParser      =   function(){};

ISOMParser.prototype.buildJSON  =   function(xml, callback){
    async.parallel({isom: function(cb){

        //console.log('ISOMParser|xml:',JSON.stringify(xml));

        xml2js.parseString(xml, options, function(err, json) {

            //console.log('ISOMParser|ERROR:',JSON.stringify(err));
            //console.log('ISOMParser|json:',JSON.stringify(json));

            if(!err && json){
                var user        =   null;
                var data        =   json.message.isomsg.field;
                var response    =   {};
                async.forEachOf(data, function iterator(value, key, next){
                    var element =   value.$;
                    response[element.id]  = element.value;
                    next();
                }, function _done(){
                    cb(null, {user: user, value:response});
                });
            }else{
                cb('#isom.parser.error');
            }
        });
    }}, function done(err, result){
        if(!err && result){
            var data    =   {};
            var isom    =   result.isom.value;
            //------------- ISOM CONFIG MAPPER-----------//
            async.waterfall([
                function _locateMapper(fx) {
                    configService.locate('ISOM_MAPPER', function (err, config) {
                        if(!err && config){
                            fx(null, config.value);
                        }else{
                            fx(null, mapper);
                        }
                    });
                }
            ],
            function _done(err, mapper) {
                if(err) {
                    logger.error(err);
                }
                async.forEachOf(mapper, function process(value, key,  next){
                    if(isom[key] && isom[key]!=undefined){
                        data[value] = isom[key];
                    }
                    next();
                }, function _done(){
                    callback(null, data);
                });
            });
        }else{
            callback(err);
        }
    });
};

module.exports  =  new ISOMParser();
