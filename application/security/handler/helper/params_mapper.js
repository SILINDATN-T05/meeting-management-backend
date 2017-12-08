
var async       =   require('async');
var helper      =   exports = module.exports = {};

helper.mapParams    =   function(data, mapper, callback){
    async.waterfall([
        function doMap(next){
            var result          =   {};
            var template_error  =   null;
            async.forEachOf(mapper, function doMap(value, key,  cb){
                    var parts           =   value.split('|');
                    var param           =   parts.shift();
                    var constraints     =   parts.shift()||1;
                    var default_value   =   parts.shift()||undefined;
                    result[param]       =   data[key] ? data[key]
                                            :  constraints && constraints === '0'
                                            ?  default_value
                                            ?  default_value
                                            :  ''
                                            :  default_value;
                    cb();
            }, function _done(){
                next(template_error, result);
            });
        },
        function doValidate(result, next){
            var param =   null;
            async.forEachOf(result, function doMap(value, key,  cb){
                param   =   value === undefined ? key:param;
                cb();
            }, function _done(){
                next(param, result);
            });
        }
    ],
    function done(err, result){
        callback(err, result);
    });
};
module.exports  =   helper;
