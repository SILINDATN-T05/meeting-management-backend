var mongoose        = require('mongoose');
var Schema          = mongoose.Schema;
//-----------------MIDDLEWARE--------------//
var base            =   require('./plugins/BaseModel');
var auditor         =   require('./plugins/TrailsLogger');
var Name            =   require('./plugins/UpperCaseName');
//--------------------------------------//
var TransTemplateSchema = new Schema({
    name:               { type: String, required: true},
    messageTemplate:    { type: Object, required: true},
    responseMapper:     { type: Object, required: false},
    endPoint:           { type: String, required: false, default:'/'},
    action:             { type: String, required: false, default:''},
    description:        { type: String, required: true},
    headers:            { type: Object, required: false, default: {}}
});
TransTemplateSchema.plugin(base);
TransTemplateSchema.plugin(auditor);
TransTemplateSchema.index({name:1, bank:1},{unique:true});
TransTemplateSchema.virtual('isActive').get(function() {
    return (this.status && this.status.valueOf() == 'ACTIVE');
});
TransTemplateSchema.index({ name: 1}, { unique: true });
TransTemplateSchema.plugin(Name);
module.exports = mongoose.model('TransactionTemplate', TransTemplateSchema);

