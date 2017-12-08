var mongoose        = require('mongoose');
var Schema          = mongoose.Schema;
var Permission      =   require('./Permission-model');
//-----------------MIDDLEWARE--------------//
var base            =   require('./plugins/BaseModel');
var auditor         =   require('./plugins/TrailsLogger');
//----------------------------------------//

var RoleSchema = new Schema({
    name:           { type: String, required: true},
    description:    { type: String, required: false},
    organizationID: { type: String, required: true},
    permissions:    [{type: mongoose.Schema.Types.ObjectId, ref: 'Permission'}]
});
RoleSchema.plugin(auditor);
RoleSchema.plugin(base);
RoleSchema.index({ name: 1,organizationID:1}, { unique: true });
module.exports = mongoose.model('Role', RoleSchema);