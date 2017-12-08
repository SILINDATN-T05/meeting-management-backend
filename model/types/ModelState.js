var mongoose = require('mongoose');
var states = [
    'NEW',
    'ACTIVE',
    'SUSPENDED',
    'DELETED',
    'INACTIVE',
    'EXPIRED',
    'BLOCKED',
    'LINKED',
    'PENDING',
    'APPROVED',
    'REJECTED',
    'REISSUE',
    'REGISTRATION',
    'REGISTERED',
    'NOT_REGISTERED',
    'REMOVED',
    'EXISTS'
];
function ModelState(key, options) {
    mongoose.SchemaType.call(this, key, options, 'ModelState');
}
ModelState.prototype = Object.create(mongoose.SchemaType.prototype);
ModelState.prototype.cast = function (val) {
    val = val || 'NEW';
    val = val.toUpperCase();
    for (var i = 0; i < states.length; i++) {
        if (val === states[i]) {
            return (val);
        }
    }
    throw new Error('#state.type.invalid');
}
mongoose.Schema.Types.ModelState = ModelState;
module.exports = ModelState;