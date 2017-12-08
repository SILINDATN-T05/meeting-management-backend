var mongoose        = require('mongoose');
var Schema          = mongoose.Schema;
var base = require('./plugins/BaseModel');
var auditor = require('./plugins/TrailsLogger');
var UserStates = require('./types/UserState');

var mongoose =  require('mongoose');
var Schema = mongoose.Schema;

const MeetingSchema = new Schema({
  meeting_name: { type: String },
  meeting_type: { type: String },
  meeting_items: [{ type: Schema.Types.ObjectId, ref: 'meetingitem' }],
  meeting_date: { type: Date, default:new Date() }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (obj, ret) => { delete ret._id }
  }
})


MeetingSchema.plugin(auditor);
MeetingSchema.plugin(base);

module.exports = mongoose.model('meeting', MeetingSchema);
