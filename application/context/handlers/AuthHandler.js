
var async       =   require('async');

function AuthHandler() {

}
AuthHandler.prototype.customer  =   function (user, req, res) {
                res.send({code: '00', message: 'success', data:{}});
}
module.exports  =   new AuthHandler();
