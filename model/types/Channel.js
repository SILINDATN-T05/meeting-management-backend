var mongoose        =   require('mongoose');
var channels        =   [
                            'APP','PORTAL','WEBSERVICE',"WEB-API"
                        ];

function Channel(key, options) {
    mongoose.SchemaType.call(this, key, options, 'Channel');
}
Channel.prototype = Object.create(mongoose.SchemaType.prototype);
Channel.prototype.cast = function(val) {
    val     =   val.toUpperCase();
    for(var i =0; i<channels.length;i++){
        if(val === channels[i]){
            return(val);
        }
    }
    throw new Error('#channel.type.invalid');
}
mongoose.Schema.Types.Channel =   Channel;
module.exports                =   Channel;