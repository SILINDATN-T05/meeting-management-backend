
var S           =   require('string');
var helper      =   exports = module.exports = {};

helper.prepare  =   function (query, callback) {
    try{
        if(typeof query!='object') {
            query = JSON.parse(query);
        }
    }catch (e){
        console.log('Query-helper:', e);
    }
    if(query && query!=undefined){
        var str =   JSON.stringify(query);
        str     =   S(str).replaceAll('@','.').s;
        str     =   S(str).replaceAll('#','$').s;
        str     =   S(str).replaceAll('&','#').s;
        //console.log('QUERY     1:  ', str);
        try{
            callback(null, JSON.parse(str));
        }catch(e){
            callback('#query_helper.parser.failed');
        }
    }else{
        callback('#query_helper.query.invalid');
    }
}
module.exports  =   helper;
