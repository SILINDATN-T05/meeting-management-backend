var mongoose        = require('mongoose');
var Schema          = mongoose.Schema;
var S               =   require('string');
var array           =   require('array');
//--------------PLUGIN------------------//
var base            =   require('./plugins/BaseModel');
var auditor         =   require('./plugins/TrailsLogger');
//------------------------------------------//
var MessageSchema = new Schema({
    code :              { type: String, required: true},
    description :       { type: String, required: false, default:''},
    organizationID:     { type: String, required: false},
    message:            [ {
                                language:   {type: Schema.ObjectId,  required: true, ref: 'Language'},
                                text:       { type: String,  required: true}
                        }]
});
MessageSchema.plugin(auditor);
MessageSchema.plugin(base/*,{duplicate:['code']}*/);
MessageSchema.pre('save', function(next){
    var self    =   this;
    if(self.code){
        self.code   =   S(self.code).collapseWhitespace().s;
        self.code   =   S(self.code).replaceAll(' ', '.').s;
        self.code   =   self.code.toLowerCase();
        var langs   =   array();
        for(i=0;i<self.message.length;i++){
            var msg =   self.message[i];
            if(langs.has(msg.language)){
                return  next(new Error('messages.language.duplicate'));
            }
            langs.push(msg.language);
        }
        return  next();
    }else{
        next(new Error('messages.code.required'));
    }
});
MessageSchema.index({ code: 1, organizationID: 1}, { unique: true });
module.exports = mongoose.model('Messages', MessageSchema);