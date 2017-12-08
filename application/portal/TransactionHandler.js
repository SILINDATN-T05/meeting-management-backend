
var express         =   require('express');
var router          =   express.Router();
var handler         =   express();
var logger          =   require('util');
var bodyParser      =   require('body-parser').json();
//var transactionModel     =   require('../../model/SERVERTransaction-model');

router.post('/viewTransactions', bodyParser, function(req, res) {
    res.send({code:'06', message:'failed, wrong implementation, read transaction data from org'});
    /*transactionModel.find({},function(err, apps){
        if(err){
            res.send({code:'00', message:'success', data:apps});
        }else{
            res.send({code:'06', message:err});
        }
    });*/
});
handler.use('/application', router);
module.exports = handler;
