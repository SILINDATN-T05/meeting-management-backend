
var xml2js                  =   require('xml2js');
var options                 =   {explicitArray: false, tagNameProcessors:[xml2js.processors.stripPrefix]};

var SOAPParser              =   function (){};

SOAPParser.prototype.buildJSON  =   function(xml, callback){
    xml2js.parseString(xml, options, function(err, json) {
        if(!err && json && json.Envelope && json.Envelope.Body) {
            return callback(err, json.Envelope.Body);
        }else{
            return callback(err || '#soap.parser.message.invalid');
        }
    });
};

module.exports  =   new SOAPParser();
