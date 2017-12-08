
var HTTPClient      =   require('./client/http_client');
var client          =   new HTTPClient();

module.exports  =    function(port, path, user, data, callback){
    var parts   =   path.split('/');
    var request =   {
        context:parts.shift(),
        target: parts.shift(),
        action: parts.shift(),
        data:   data,
        user:   user
    };
    client.send(port, request, callback);
};

