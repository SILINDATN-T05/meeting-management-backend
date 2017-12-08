var mongoose        = require('mongoose');
var Schema          = mongoose.Schema;
var base = require('./plugins/BaseModel');
var auditor = require('./plugins/TrailsLogger');
var UserStates = require('./types/UserState');

const MeetingItemsSchema = new Schema({
    meetin_type: { type: Schema.Types.ObjectId, ref: 'meetingtype' },
    meetin_item: { type: String, required:true },
    comments: { type: String },
    status: { type: String },
    actionby: { type: String }
  }, {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (obj, ret) => { delete ret._id }
    }
  })

MeetingItemsSchema.plugin(auditor);
MeetingItemsSchema.plugin(base);

module.exports = mongoose.model('meetingitem', MeetingItemsSchema);
