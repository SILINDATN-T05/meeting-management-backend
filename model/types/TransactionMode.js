var mongoose        =   require('mongoose');
var states          =   [
                            'SYNC',
                            'ASYNC',
                            'HYBRID'
                        ];
function TransactionMode(key, options) {
    mongoose.SchemaType.call(this, key, options, 'TransactionMode');
}
TransactionMode.prototype = Object.create(mongoose.SchemaType.prototype);
TransactionMode.prototype.cast = function(val) {
    val     =   val|| 'SYNC';
    val     =   val.toUpperCase();
    for(var i =0; i<states.length;i++){
        if(val === states[i]){
            return(val);
        }
    }
    return('SYNC');
}
mongoose.Schema.Types.TransactionMode           =   TransactionMode;
module.exports                                  =   TransactionMode;