
var mongoose        = require('mongoose');
var Schema          = mongoose.Schema;
var Channel         =   require('./types/Channel');

//--------------MIDDLEWARE------------------//
var base            =   require('./plugins/BaseModel');
var auditor         =   require('./plugins/TrailsLogger');
//------------------------------------------//

const MeetingTypeSchema = new Schema({
    name:               { type: String, required: true},
    description :       { type: String, required: false},
    organizationID:     { type: String, required: true},
    abbr:               { type: String, required: true},
    status:             { type: String,  enum:['ACTIVE','SUSPENDED','INACTIVE'], default: 'ACTIVE'}
});
MeetingTypeSchema.plugin(auditor);
MeetingTypeSchema.plugin(base);
MeetingTypeSchema.index({ name: 1}, { unique: true });
module.exports = mongoose.model('meetingtypes', MeetingTypeSchema)