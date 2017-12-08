var mongoose        = require('mongoose');
var Schema          = mongoose.Schema;
//--------------MIDDLEWARE------------------//
var base            =   require('./plugins/BaseModel');
var auditor         =   require('./plugins/TrailsLogger');
//------------------------------------------//
var Code            =   require('./types/Code');

var LanguageSchema = new Schema({
    code :          { type: Code,    required: true},
    name:           { type: String,  required: true},
    system_default: { type: Boolean, default: false}
});
LanguageSchema.plugin(base);
LanguageSchema.plugin(auditor);
LanguageSchema.index({ code: 1}, { unique: true });
LanguageSchema.pre('save', function (next) {
   var self =   this;
    self.findOne({code:self.code}, function(err, doc){
        next((doc && self.isNew)?new Error('#language.create.code.exist'):null);
    })
});
LanguageSchema.pre('save', function (next) {
    var self = this;
    if(self.isNew && self.system_default){
        self.findOne({system_default:true},function(err, lang){
            if(!err && lang){
                next(new Error('#language.create.system_default.exist'));
            }else{
                self.findOne({code: self.code}, function(err, doc){
                    if(!err && doc){
                         next(new Error('#language.create.code.exist'));
                    }else{
                        next();
                    }
                });
            }
        });
    }else{
        next();
    }
});
module.exports = mongoose.model('Language', LanguageSchema);