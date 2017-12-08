var async               =   require("async");
var Chance              =   require('chance');
var mongoose        = require('mongoose');
var Schema          = mongoose.Schema;
var Channel             =   require('./types/Channel');
var TransactionStates   =   require('./types/TransactionState');
var Config              =   require('./Configuration-model');

var chance              =   new Chance();
var configName          =   'ORG-CONFIG';

var SERVERTranSchema = new Schema({
        server_ref :       { type: String,  default: '' , index: { unique: true }},
        transaction_type:   { type: Schema.ObjectId, ref: 'TransactionType' },
        session:            { type: Schema.ObjectId, ref: 'UserSession' },
        user:               { type: Schema.ObjectId, ref: 'User' },
        router:             { type: Schema.ObjectId, ref: 'Router' },
        status:             { type: TransactionStates, default: 'PROCESSING'},
        channel:            { type: Channel,  required: false},
        application:        { type: String, default: '' },
        response_code:      { type: String, default: '' },
        current_step:       { type: String, default: '' },
        date_time:          { type: Date,   required: false},
        extras:             { type: Object, required: false, default:{}},
    });
SERVERTranSchema.index({server_ref: 1}, { unique: true });
SERVERTranSchema.pre('save', function(next) {
    var self = this;
    var cnt = 0;
    var org_prefix = "";
    Config.findOne({name: configName}, function (err, config) {
       if (!err && config && config.value.org_prefix) {
            org_prefix = config.value.org_prefix;
        }
        if (self.isNew) {
            self.server_ref         = org_prefix+self._id.toString().toUpperCase();
            next();
        } else {
            next();
        }
    });
});

SERVERTranSchema.methods.updateState = function(code, step_name, cb) {
    var self    = this;
    self.response_code  =   code;
    self.current_step   =   step_name;
    self.save(function () {
        cb();
    });
}
module.exports = mongoose.model('SERVERTransaction', SERVERTranSchema);
