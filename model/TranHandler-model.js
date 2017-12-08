var mongoose        = require('mongoose');
var Schema          = mongoose.Schema;
var HandlerLocator  =   require('../application/context/tran_handler/HandlerLocator');
var ParserLocator   =   require('../application/context/response_parser/ParserLocator');
//-----------------MIDDLEWARE--------------//
var base            =   require('./plugins/BaseModel');
var auditor         =   require('./plugins/TrailsLogger');
var Name            =   require('./plugins/UpperCaseName');
//----------------------------------------//
var handlerLocator  =   new HandlerLocator();
var parserLocator   =   new ParserLocator();

var TransHandlerSchema = new Schema({
    name:       { type: String, required: true},
    handlerPath:{ type: String, required: true},
    parserPath: { type: String, required: true},
    description:{ type: String, required: true},
    template:   { type: Schema.ObjectId, required: true, ref: 'TransactionTemplate'},
    //---------------SET MESSAGE STORING-----------//
    store_request:  { type: Boolean,    required: false, default: true},
    store_response: { type: Boolean,    required: false, default: true},
    template_ttl:   { type: Number,     required: false, default: -1},
});
TransHandlerSchema.plugin(base);
TransHandlerSchema.plugin(auditor);
TransHandlerSchema.plugin(Name);
TransHandlerSchema.virtual('isActive').get(function() {
    return (this.status && this.status.valueOf() == 'ACTIVE');
});
TransHandlerSchema.pre('save', function (next) {
    var self = this;
    if(handlerLocator.handlerExist(self.handlerPath)){
        if(parserLocator.parserExist(self.parserPath)){
            next();
        }else{
            next('Parser does not exist');
        }
    }else{
        next('#tranhandler.create.handler.invalid');
    }
});
TransHandlerSchema.index({ name: 1}, { unique: true });
module.exports = mongoose.model('TransactionHandler', TransHandlerSchema);