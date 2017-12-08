var mongoose        = require('mongoose');
var Schema          = mongoose.Schema;
var ttl             =   require('./helper/transaction_logs_ttl');
var Channel         =   require('./types/Channel');
var Platform        =   require('./types/Platform');
var Config          =   require('./Configuration-model');

var configName          =   'ORG-CONFIG';

var TTL             =   '30m';// default


var TranStepLogSchema = new Schema({
    server_ref:   { type: String,  required: false},
    step_name :    { type: String,  required: true },
    step_position: { type: String,  required: false, default:''},
    channel:       { type: Channel, required: false},
    platform:      { type: Platform, required: false},
    //---------------- log detail-----------------//
    request :               { type: Object, required: false },
    response :              { type: Object, required: false },
    step_data :             { type: Object, required: false, default:{}},
    message :               { type: Object, required: false },
    req_options :           { type: Object, required: false },
    response_code :         { type: String, required: false, default:''},
    request_date :          { type: Date, required: true , default:Date.now()},
    response_date:          { type: Date, required: false, default: '' },
    user :  {type: Schema.Types.ObjectId, ref: 'user'},
    //------------- HANDLER & PARSER --------------//
    handler_name :        { type: String, required: true},
    parser_name :         { type: String, required: false, default:''},
});
TranStepLogSchema.index({step_name:1, server_ref:1},{unique:true});
TranStepLogSchema.index({server_ref : -1});
module.exports = mongoose.model('TranStepLog', TranStepLogSchema);


