var mongoose        = require('mongoose');
var Schema          = mongoose.Schema;

var ChangesSchema = new Schema({
    model:              {type: String, required: false},
    typeOfChange:       {type: String, enum:['CREATE','UPDATE','DELETE'], required: true},
    newObject:          {type: Object, required: false, default:{}},
    oldObject:          {type: Object, required: false, default:{}},
    dateOfChange:       {type: Date,   default:new Date()},
    changedBy:          {type: Schema.ObjectId, required: false},
    createdBy:          {type: Schema.ObjectId,              required: true},
    updatedBy:          {type: Schema.ObjectId,              required: false},
    //------------------------------------------------------------//
    status:             {type: String, enum:['SUCCESS','FAILED','PENDING'], default: 'SUCCESS'},
    failure_reason:     {type: String, default:'---'},
});

module.exports = mongoose.model('changes', ChangesSchema);