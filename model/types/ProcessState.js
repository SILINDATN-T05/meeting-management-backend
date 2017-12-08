
var mongoose        =   require('mongoose');
var states          =   [
                            'SCHEDULED',   'READY',
                            'FAILED',   'RUNNING',
                            'STOPPED'
                        ];
function ProcessState(key, options) {
    mongoose.SchemaType.call(this, key, options, 'ProcessState');
}
ProcessState.prototype = Object.create(mongoose.SchemaType.prototype);
ProcessState.prototype.cast = function(val) {
    val     =   val|| 'READY';
    val     =   val.toUpperCase();
    for(var i =0; i<states.length;i++){
        if(val === states[i]){
            return(val);
        }
    }
    return('READY');
}
mongoose.Schema.Types.ProcessState          =   ProcessState;
module.exports                              =   ProcessState;