var post_util   = exports           = module.exports    = {};
var request     = require('request');
var xml2js      = require('xml2js');
var util        = require('util');

post_util.post = function(url, action, payload, callback, headercb) {

    var options = {

        url: url,
        method:'POST',
        SOAPAction: action,
        headers:{ 'Content-Type': 'text/xml; charset=utf-8' }

    };

    options.body = payload;

    request.post(options,  function(err, response, body) {

        if(!err && response.statusCode == 200) {

            try{

                xml2js.parseString(body, {explicitArray: false}, function(error, json) {

                    if(error) {

                        logger.fatal('INVALID BODY');

                    }else{

                        var clientDetails = json['soap:Envelope']['soap:Body'].loadaccountdetailsResponse.loadaccountdetailsResult['diffgr:diffgram'].DocumentElement.CLIENTDETAILS;

                        return callback(null, clientDetails);

                    }

                });

            }catch(e) {

                return callback('Invalid response');

            }

        }else{

            return callback('Failed to send sms [' + err + ']');

        }

    });

};

module.exports  =  post_util;
