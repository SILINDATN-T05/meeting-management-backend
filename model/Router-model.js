var mongoose        = require('mongoose');
var Schema          = mongoose.Schema;
var Channel         =   require('./types/Channel');
//-----------------MIDDLEWARE--------------//
var base            =   require('./plugins/BaseModel');
var auditor         =   require('./plugins/TrailsLogger');
//----------------------------------------//

var RouterSchema = new Schema({
    action:           { type: String, required: true    },
    application:      { type: String, required: false   },
    tran_type:        { type: String, required: true    },
    channel:          { type: Channel},
    organizationID:   { type: String, required: true    },
    authenticated:    { type: Boolean, required: false, default: true}
});
RouterSchema.plugin(auditor);
RouterSchema.plugin(base);
RouterSchema.index({ action: 1,application:1, tran_type:1, organizationID:1}, { unique: true });
module.exports = mongoose.model('Router', RouterSchema);