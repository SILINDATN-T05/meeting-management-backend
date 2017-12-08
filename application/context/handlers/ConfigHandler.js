
var ConfigService   =   require('../../../engine/ConfigService');
var configService   =  new ConfigService();

var handler         =   function(){};

handler.prototype.create =   function(user, req, res){
    configService.create(user, req, function(err, config){
        if(!err && config) {
            res.send({code: '00', message: 'success', data: config});
        }else{
            res.send({code: '06', message: err});
        }
    });
};

handler.prototype.delete =   function(user, req, res){
    configService.delete(user, req.name, function(err){
        if(!err) {
            res.send({code: '00', message: 'success'});
        }else{
            res.send({code: '06', message: err});
        }
    });
};

handler.prototype.list =   function(user, req, res){
    configService.list(function(err, config){
        if(!err && config) {
            res.send({code: '00', message: 'success', data: config});
        }else{
            res.send({code: '06', message: err});
        }
    });
};

handler.prototype.edit =   function(user, req, res){
    configService.edit(user, req, function(err, config){
        if(!err && config) {
            res.send({code: '00', message: 'success', data: config});
        }else{
            res.send({code: '06', message: err});
        }
    });
};

handler.prototype.details =   function(user, req, res){
    configService.locate(req.name, function(err, config) {
        if(!err && config) {
            res.send({code: '00', message: 'success', data: config});
        }else{
            res.send({code: '06', message: err});
        }
    });
};

module.exports  =   handler;
