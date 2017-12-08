var mongoose        = require('mongoose');
var Schema          = mongoose.Schema;
var base                =   require('./plugins/BaseModel');
var auditor             =   require('./plugins/TrailsLogger');
var Channel             =   require('./types/Channel');


var PermissionSchema = new Schema({
    code:    { type: String, required: true },
    category:{ type: String, required: true },
    type:    { type: String, required: true },
    menu:    { type: Object, required: true },
    channel: { type: Channel,required: true},
    system:  { type: String,  enum:['YES','NO','BOTH'],  required: false, default:'NO'}
});
PermissionSchema.plugin(auditor);
PermissionSchema.plugin(base);
PermissionSchema.index({ code: 1}, { unique: true });

module.exports = mongoose.model('Permission', PermissionSchema);