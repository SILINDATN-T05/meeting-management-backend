var mongoose = require('mongoose');
var states = [
    'ACTIVE',
    'INACTIVE',
    'BLOCKED',
    'NEW',
    'REGISTRATION',
    'REISSUE',
    'EXPIRED',
    'REGISTERED',
    'NOT_REGISTERED',
    'REMOVED',
    'EXISTS'
];
function UserState(key, options) {
    mongoose.SchemaType.call(this, key, options, 'UserState');
}
UserState.prototype = Object.create(mongoose.SchemaType.prototype);
UserState.prototype.cast = function (val) {
    val = val || 'NEW';
    val = val.toUpperCase();
    for (var i = 0; i < states.length; i++) {
        if (val === states[i]) {
            return (val);
        }
    }
    throw new Error('#state.type.invalid');
}
mongoose.Schema.Types.UserState = UserState;
module.exports = UserState;