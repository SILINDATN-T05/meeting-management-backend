var mongoose        = require('mongoose');
var Schema          = mongoose.Schema;

var History = new Schema({
    action_date:    {   type: Date, required: false, default: Date.now},
    action:         {   type: String, required: false, default: ''}
},{_id:false});
module.exports  =   History;