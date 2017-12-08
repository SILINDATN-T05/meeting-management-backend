
var request     =   	require('../../tran_handler/trans_utils/PostJSON');
var headers	=	{timeout:60000, headers:{timeout:60000}};
function Http_Client(){

}
Http_Client.prototype.send   =   function(port, payload, callback){
    var url =   'http://127.0.0.1:'+port+'/process';
    request.post(url, '', payload, function(err, data){
        return callback(err, data);
    });
}
module.exports  =   Http_Client;
