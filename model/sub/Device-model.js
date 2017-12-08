var mongoose        =   require('mongoose');
var Platform        =   require('../types/Platform');
var Status          =   require('../types/DeviceState');

var Schema          = mongoose.Schema;

var Device = new Schema({
    deviceId :      { type: String,     required: true},
    platform:       { type: Platform,   required: true},
    token:          { type: String,     required: false, default:''},
    status:         {type: Status, default: 'NEW'}
},{_id:false});
module.exports  =   Device;