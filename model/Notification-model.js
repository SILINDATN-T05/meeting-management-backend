/**
 * Created by johanv on 2015/11/09.
 */
/**
 * Created by takonewa on 2015/08/04.
 */
var mongoose        = require('mongoose');
var Schema          = mongoose.Schema;
var base            =   require('./plugins/BaseModel');
var auditor         =   require('./plugins/TrailsLogger');


var NotificationSchema = new Schema({
    msisdn:            {type: String},
    type:              {type: String,  enum:['SMS','IN-APP','EMAIL','PUSH'], default:'SMS'},
    status:            {type: String,  enum:['PENDING','SENT','FAILED','LOCKED'], default:"PENDING"},
    message:           {type: String},
    subject:           {type: String},
    everest_ref:       {type: String, default:''},
    emailObject:       {
        toEmailAddress:    {type: String},
        fromEmailAddress:  {type: String},
    },
    responseCode:      {type: String},
    responseMessage:   {type: String},
    responseRef:       {type: String},
    owner:             {type: mongoose.Schema.Types.ObjectId,  ref: 'User'},
    deviceId:          {type: String},
    token:             {type: String},
    inAppStatus:       {type: String,  enum:['UNREAD','READ','DELETED'], default:"UNREAD"},
    platform:          {type: String,  enum:['APPLE','ANDROID','NONE']},
    dateCreated:       {type: Date},
});
//NotificationSchema.plugin(base);
//NotificationSchema.plugin(auditor);
module.exports  =   mongoose.model('Notification', NotificationSchema);
