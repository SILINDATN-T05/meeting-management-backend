
var Model                       =   require('../../../model/index');
var log4js                      =   require('log4js');
var logger                      =   log4js.getLogger('TRAN_TYPE_HANDLER');
var Transaction                 =   Model.Transaction;
var async                       =   require('async');

var handler                     =   function() {};

handler.prototype.findTransactions = function (user, req, res) {
    async.waterfall([
        function (next) {
            if (req.data.account) {
                Account
                    .findOne({accountNumber: req.data.account.accountNumber})
                    .exec(function (err, account) {
                        req.data.account = account._id;
                        next(null, req);
                    });
            } else {
                next(null, req);
            }
        },

        function (err, next) {
            if (req.data.customer) {
                Customer
                    .find({msisdn: req.data.customer.msisdn})
                    .exec(function (err, customer) {
                        req.data.customer = customer[0]._id;
                        next(null, req);
                    });
            } else {
                next(null, req);
            }
        } ],
        function (err, done) {
            Transaction.find(done.data || {})
                .populate('transaction_type')
                .populate('account')
                .populate('customer')
                .exec(function(err, transactions){
                    if(!err){
                        res.send({code:'00', message:'success', data: transactions});
                    }else{
                        logger.error(err);
                        res.send({code:'06', message: err});
                    }
                });
        });


};
module.exports  =   handler;

