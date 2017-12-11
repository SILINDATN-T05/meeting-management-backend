var mongoose        = require('mongoose');
var Schema          = mongoose.Schema;
var base = require('./plugins/BaseModel');
var auditor = require('./plugins/TrailsLogger');
var UserStates = require('./types/UserState');

const MeetingItemsSchema = new Schema({
    meetin_item: { type: String, required:true },
    comments: { type: String },
    status:             { type: String,  enum:['ACTIVE','SUSPENDED','CANCELLED','INACTIVE'], default: 'ACTIVE'},
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