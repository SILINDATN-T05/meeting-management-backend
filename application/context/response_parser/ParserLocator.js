
var Parser              =   require('./Response-parser');
var fs                  =   require('fs');
var util                =   require('util');
var string              =   require('string');
var recursive           =   require('recursive-readdir-sync');

var Locator             =   function() {};

var handlerPath =   function(name){
    return __dirname + '/' + name + '-parser.js';
};

Locator.prototype.locateParser =   function(name){
    var location    =   handlerPath(name);
    if(fs.existsSync(location)){
        var handler =   require(location);
        if(handler instanceof Parser) {
            return handler;
        }else{
            throw new Error(util.format('%s is not a valid Parser', name));
        }
    }else{
        throw new Error(util.format('Parser %s not implemented yet', name));
    }
};

Locator.prototype.listParsers =   function(){
    var handlers        =   [];
    var files           =   recursive(__dirname);
    var self            =   this;
        for(var k = 0; k < files.length; k += 1) {
            var name    =   string(files[k]).trim().s;
            var pos     =   name.indexOf('-parser');
            name    =   name.substr(0, pos);
            try{
                self.locateParser(name);
                handlers.push(name);
            }catch(e){
                throw new Error(e.message);
            }
        }

    return handlers;
};

Locator.prototype.parserExist =   function(name){
    var handlers    =   this.listParsers();
    for(var k = 0; k < handlers.length; k += 1) {
        if(handlers === name){
            return true;
        }
    }

    return false;
};

module.exports = exports = Locator;
