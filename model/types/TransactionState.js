var mongoose        =   require('mongoose');
var states          =   [
                            'PROCESSING',   'PENDING',
                            'FAILED',       'SUCCESS','ERROR',
                            'STEP_TIMEOUT', 'PROCESS_TIMEOUT'
                        ];
function TransactionState(key, options) {
    mongoose.SchemaType.call(this, key, options, 'TransactionState');
}
TransactionState.prototype = Object.create(mongoose.SchemaType.prototype);
TransactionState.prototype.cast = function(val) {
    val     =   val|| 'PROCESSING';
    val     =   val.toUpperCase();
    for(var i =0; i<states.length;i++){
        if(val === states[i]){
            return(val);
        }
    }
    throw new Error('#channel.type.invalid');
}
mongoose.Schema.Types.TransactionState =   TransactionState;
module.exports                         =   TransactionState;