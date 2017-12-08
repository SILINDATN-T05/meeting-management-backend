var mongoose        =   require('mongoose');
var Schema          =   mongoose.Schema;

var AuthDetail = new Schema({
    previousHash: { type: String,   required: false },
    change_date:  { type: Date,     required: false },
    reason:       { type: String,   required: false, default:'' },
    channel:      { type: String,   required: false, default:'' },
    status:       { type: String,   required: false, default:'' },
    device:       { type: Object,   required: false, default:{} },
});
module.exports  =   AuthDetail;