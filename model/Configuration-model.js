var mongoose        = require('mongoose');
var Schema          = mongoose.Schema;
//-----------------MIDDLEWARE--------------//
var base = require('./plugins/BaseModel');
var auditor = require('./plugins/TrailsLogger');
var Name = require('./plugins/UpperCaseName');

//--------------------------------------//

var ConfigurationSchema = new Schema({
    name: {type: String, required: true},
    value: {type: Object, required: true},
    refCount: {type: Number, default: 1}
});
ConfigurationSchema.pre('save', function (next) {
    var self = this;
    self.refCount = self.refCount + 1;
    if (!self.name) {
        return next(new Error('#config.create.name.required'))
    }
    if (!self.value) {
        return next(new Error('#config.create.value.required'))
    }
    next();
});
ConfigurationSchema.plugin(base);
ConfigurationSchema.plugin(auditor);
ConfigurationSchema.plugin(Name);
ConfigurationSchema.index({name: 1}, {unique: true});

module.exports = mongoose.model('Configuration', ConfigurationSchema);

