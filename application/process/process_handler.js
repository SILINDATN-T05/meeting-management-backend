
var statusParser            =   require('./TranStatusParser');

exports.START = function(data, done){
    done(data);
};
exports.END = function(options, done){
    var self        =   this;
    var flow        =   self.getFlow();
    var options     =   self.getOptions();
    var server_ref =   self.getServerRef();

    self.getTransaction(function(err, trans){

        if(!err && trans){
            statusParser.parseFinalStatus(flow, server_ref, options, function (result) {
                trans.updateState(result.code, 'END', function(){
                    self.clean();
                    done(options);
                });
            });
        }else{
            self.clean();
            done(options);
        }
    });
};
exports.STARTDone = function(options, done){
    done(options);
};

