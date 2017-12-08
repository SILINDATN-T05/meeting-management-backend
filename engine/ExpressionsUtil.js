var S           =   require('string');
var format      =   require('date-format');
var uuid        =   require('uuid');
var MCrypt      =   require('mcrypt').MCrypt;
var self        =   null;

function  ExpressionsUtil() {
    self =   this;
}
ExpressionsUtil.prototype.getArgs   =   function () {
    var params   =   arguments.callee.caller.arguments;
    var args     =   Array.prototype.slice.call(params, 0);
    return(args.shift().split(','));
};
ExpressionsUtil.prototype.uuid   =   function () {
    var args        =   self.getArgs();
    var str         =   uuid.v1();
    switch(args.shift()){
        case 1: break;
        case 2: str = uuid.v1();
                break;
    }
    var _rplc   =   args.shift();
    if(_rplc && (_rplc===true || _rplc==='true')){
        console.error(_rplc);
        str   =   S(str).replaceAll('-','').s;
    }
    return(str.toUpperCase());
}
ExpressionsUtil.prototype.Date   =   function () {
    var args        =   self.getArgs();
    var str         =   args.shift();
    var date        =   args.pop();
    if(str && date){
        return(format.asString(str, new Date(date)));
    }else {
        return('#expression.util.date.params.invald');
    }
}
ExpressionsUtil.prototype.current_date   =   function () {
    var args        =   self.getArgs();
    var str         =   args.shift();
    if(str){
        return(format.asString(str, new Date()));
    }else {
        return('#expression.util.date.params.invald');
    }
}
ExpressionsUtil.prototype.toHex   =   function () {
    var args        =   self.getArgs();
    var str         =   args.shift();
    if(str){
        var result = '';
        for (var i=0; i<str.length; i++) {
            result += str.charCodeAt(i).toString(16);
        }
        return result;
    }else {
        return('#expression.util.to_hex.param.invald');
    }
}
ExpressionsUtil.prototype.toDecimal   =   function () {
    var args        =   self.getArgs();
    var str         =   args.shift();
    if(str){
        var result = '';
        for (var i=0; i<str.length; i++) {
            result += str.charCodeAt(i).toString(10);
        }
        return result;
    }else {
        return('#expression.util.to_dec.param.invald');
    }
}
ExpressionsUtil.prototype.toBin   =   function () {
    var args        =   self.getArgs();
    var str         =   args.shift();
    if(str){
        var result = '';
        for (var i=0; i<str.length; i++) {
            result += str.charCodeAt(i).toString(2);
        }
        return result;
    }else {
        return('#expression.util.to_bin.param.invald');
    }
}
ExpressionsUtil.prototype.rijndael_decrypt  =   function () {
    var args        =   self.getArgs();
    var key         =   args.shift();
    var data        =   args.shift();
    var rijndael    =   new MCrypt('rijndael-256', 'cbc');
    rijndael.validateIvSize(false);
    rijndael.open(key, key);
    return(rijndael.decrypt(data));
}
ExpressionsUtil.prototype.rijndael_encrypt  =   function () {
    var args        =   self.getArgs();
    var key         =   args.shift();
    var data        =   args.shift();
    var rijndael    =   new MCrypt('rijndael-256', 'cbc');
    rijndael.validateIvSize(false);
    rijndael.open(key, key);
    return(rijndael.encrypt(data));
}
//-------------ADD OTHER METHODS BELOW -------------//
//  :)
//--------------------------------------------------//
module.exports  =   new ExpressionsUtil();