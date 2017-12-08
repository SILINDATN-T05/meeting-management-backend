
var socket;
var handler = function (soc){
    socket  =   soc;
};
handler.prototype.send  =   function(data){
    socket.sendMessage(data);
};
module.exports  =   handler;
