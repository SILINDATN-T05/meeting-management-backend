var mongoose = require('mongoose');
var states = [
    'ACTIVE',
    'INACTIVE',
    'BLOCKED',
    'NEW',
    'REISSUE',
    'EXPIRED',
    'REGISTRATION'
];
function DeviceState(key, options) {
    mongoose.SchemaType.call(this, key, options, 'DeviceState');
}
DeviceState.prototype = Object.create(mongoose.SchemaType.prototype);
DeviceState.prototype.cast = function (val) {
    val = val || 'NEW';
    val = val.toUpperCase();
    for (var i = 0; i < states.length; i++) {
        if (val === states[i]) {
            return (val);
        }
    }
    throw new Error('#state.type.invalid');
}
mongoose.Schema.Types.DeviceState = DeviceState;
module.exports = DeviceState;