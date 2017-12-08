
var TranHandler         =   require('./TranHandler');
var fs                  =   require('fs');
var util                =   require('util');
var string              =   require('string');
var logger              =   require('winston');
var Locator             =   function() {};
var recursive           =   require('recursive-readdir-sync');

var handlerPath =   function(name){
    return __dirname + '/' + name + '-handler.js';
};

Locator.prototype.locateHandler =   function(name){
    var location    =   handlerPath(name);
    if(fs.existsSync(location)){
        var handler =   require(location);
        if(handler instanceof TranHandler) {
            return handler;
        }else{
            throw new Error(util.format('%s is not a valid Handler', name));
        }
    }else{
        throw new Error(util.format('Handler %s not implemented yet', name));
    }
};

Locator.prototype.listHandlers =   function(){
    var handlers        =   [];
    var files           =   recursive(__dirname);
    var self            =   this;
        for(var k = 0; k < files.length; k += 1) {
            var name    =   string(files[k]).trim().s;
            var pos     =   name.indexOf('-handler.js');
            name    =   name.substr(0, pos);
            try{
                self.locateHandler(name);
                handlers.push(name);
            }catch(e){
                logger.error(e.message);
            }
        }

    return handlers;
};

Locator.prototype.handlerExist =   function(name){
    var handlers    =   this.listHandlers();
    for(var k = 0; k < handlers.length; k +=1) {
        if(handlers === name){
            return true;
        }
    }

    return false;
};

module.exports = exports = Locator;
