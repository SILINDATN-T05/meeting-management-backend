
var TransactionHandler = function (){};

TransactionHandler.prototype.processStep    = function(endPoint, action, payload, callback) {
    return callback(null, {code:'00', message:'success', data:{message:'no default implementation'}});
};

TransactionHandler.prototype.payloadSample  =   function () {
    return{
        code:'00',
        message:'success',
        data:{params:'value1'}
    };
};

TransactionHandler.prototype.defaultParser  =   function () {
    return'ROUTER';
};

module.exports = exports = TransactionHandler;
