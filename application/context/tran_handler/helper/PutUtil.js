
var put_util       =   exports = module.exports = {};
var request = require('request');
put_util.put   =    function(options, callback, headercb) {
    request.put(options,  function(err, response, body) {
        if (!err && response.statusCode == 200) {
            //console.log(body);
            var info = JSON.parse(body);
            return callback(null, info);
        }else{
            //console.log(body);
            //console.log(response.statusCode);
            return callback('07', {responseCode:'07', responseString:'Connection failed'});
        }
    });
}
module.exports  =  put_util;
