var mongoose        = require('mongoose');
var Schema          = mongoose.Schema;
//-----------------MIDDLEWARE--------------//
var base            =   require('./plugins/BaseModel');
var auditor         =   require('./plugins/TrailsLogger');
var Name            =   require('./plugins/UpperCaseName');
//--------------------------------------//
var TransactionFlowStepSchema = new Schema({
    name :         { type: String, required: true },
    description:   { type: String, required: false},
    handler:       { type: Schema.ObjectId, required: true, ref:'TransactionHandler'},
});
TransactionFlowStepSchema.plugin(base);
TransactionFlowStepSchema.plugin(auditor);
TransactionFlowStepSchema.plugin(Name);
TransactionFlowStepSchema.index({name: 1}, { unique: true });
module.exports = mongoose.model('TransactionFlowStep', TransactionFlowStepSchema);

