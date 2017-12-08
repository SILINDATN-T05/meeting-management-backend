var mongoose         =   require('mongoose');
var platforms        =   [
                            'ANDROID', 'IOS',
                            'WINDOWS', 'AMAZON',
                            'NONE'
                        ];

function Platform(key, options) {
    mongoose.SchemaType.call(this, key, options, 'Platform');
}
Platform.prototype = Object.create(mongoose.SchemaType.prototype);
Platform.prototype.cast = function(val) {
    val     =   val||'none';
    val     =   val.toUpperCase();
    val     =   (val === 'APPLE')? 'IOS': val;
    for(var i =0; i<platforms.length;i++){
        if(val === platforms[i]){
            return(val);
        }
    }
    return('NONE');
}
mongoose.Schema.Types.Platform  =   Platform;
module.exports                  =   Platform;