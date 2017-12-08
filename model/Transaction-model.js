/**
 * Created by takonewa on 2015/08/04.
 */
var async               =   require("async");
var mongoose            =   require('mongoose');
var Chance              =   require('chance');
var Channel             =   require('./types/Channel');
var TransactionStates   =   require('./types/TransactionState');
var Config              =   require('./Configuration-model');
var shortid             =   require('shortid');
var dateFormat          =   require('dateformat');

var Schema              =   mongoose.Schema;
var chance              =   new Chance();
var configName          =   'ORG-CONFIG';

var TranSchema = new Schema({
        server_ref :       { type: String,  default: '' , index: { unique: true }},
        transaction_type:   { type: Schema.ObjectId, ref: 'TransactionType' },
        status:             { type: TransactionStates, default: 'PROCESSING'},
        channel:            { type: Channel,  required: false},
        application:        { type: String, default: '' },
        response_code:      { type: String, default: '' },
        mode:               { type: String, default: '' },
        request_date_isom:  { type: String, default: '' },
        request_date:       { type: Date,   default: Date.now() },
        current_step:       { type: String, default: '' },
        extras:             { type: Object, required: false, default:{}}

    });
//==============METHODS==============//
TranSchema.pre('save', function (next) {
    var self = this;
    var org_prefix = "";
    var org_reference_rule = "";
    var stringSize = "";
    Config.findOne({name: configName}, function (err, config) {
        if (!err && config && config.value.org_prefix) {
            org_prefix = config.value.org_prefix;
        }
        if (!err && config && config.value.org_reference_rule) {
            org_reference_rule = config.value.org_reference_rule;
        }
        if (!err && config && config.value.stringSize) {
            stringSize = config.value.stringSize;
        }
        //var cnt     = 0;
        if (self.isNew && org_reference_rule === "") {
            self.server_ref = org_prefix + self._id.toString().toUpperCase();
            self.request_date_isom   = dateFormat(self.request_date,'yyyymmdd hh:MM:ss');
            next();
        }
        else if (self.isNew && org_reference_rule === "RANDOM") {
            var tzoffset = (new Date()).getTimezoneOffset() * 60000;
            var localISODate = (new Date(Date.now() - tzoffset)).toISOString().replace(/-/g, '');
            var reference = "";
            shortid.characters('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!#');
            reference = localISODate.slice(2, 8) + org_prefix + shortid.generate();
            // added the below because some systems only allow alpha numberic characters.
            reference = reference.replace(/!/i, '1');
            reference = reference.replace(/#/i, '2');
            if(self.isNew && stringSize >0)
            {
                self.server_ref = reference.substring(0, stringSize);
            }else
            {
                self.server_ref = reference.substring(0, 12);
            }

            next();

        }
        else {
            next();
        }
    });
});
TranSchema.methods.updateState = function(code, step_name, cb) {
    var self            =   this;
    self.code           =   code;
    self.current_step   =   step_name;
    if(step_name === 'END'){
        switch (self.code) {
            case '00':
                self.status = 'SUCCESS';
                break;
            case '06':
                self.status = 'FAILED';
                break;
            case '07':
                self.status = 'TIMEOUT';
                break;
            case '11':
                self.status = 'FLOW_TIMED_OUT';
                break;
            default :
                self.status = 'PENDING';
        }
    }
    self.save(function(err){
       cb(err);
    });
}
module.exports = mongoose.model('Transaction', TranSchema);
