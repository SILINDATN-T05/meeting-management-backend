
var xml2js                  =   require('xml2js');
var options                 =   {explicitArray: false, tagNameProcessors:[xml2js.processors.stripPrefix]};

var XMLParser               =   function(){};

XMLParser.prototype.buildJSON  =   function(xml, callback){
    xml2js.parseString(xml, options, function(err, json) {
        if(!err && json){
            return  callback(err, json);
        }else{
            return callback(err||'#xml.parser.message.invalid');
        }
    });
};

module.exports  =   new XMLParser();
