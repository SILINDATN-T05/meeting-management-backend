var S               =   require('string');
var mongoose        = require('mongoose');
var Schema          = mongoose.Schema;
var Flow            =   require('./TransactionFlow-model');
var TransactionMode =   require('./types/TransactionMode');
//-----------------MIDDLEWARE--------------//
var base            =   require('./plugins/BaseModel');
var auditor         =   require('./plugins/TrailsLogger');
//--------------------------------------//

var TranTypeSchema = new Schema({
    name :          { type: String, required: true},
    code:           { type: String,  required: true},
    description:    { type: String, required: true},
    mode:           { type: TransactionMode},
    tran_flow:      { type: Schema.ObjectId, required: false, ref:'TransactionFlow'},
    tran_group:     { type: Schema.ObjectId, required: false, ref:'TransactionTypeGroup'},
    group_position: { type: Number, required: false, default:0},
    chargeGroup:    { type: Number, required: false},
    //---------------------REQUEST MAPPER & VALIDATION--//
    requestMapper:  {   mapper:{type: Object, default: {account:'account'}},
                        steps:[{
                                 name:      {type: String, required: true},
                                 mapper:    Object
                             }]
                        },
    //===========================================//
    past_tran_flows:     [{
                            tran_flow:      { type: Schema.ObjectId, required: false, ref:'TransactionFlow'},
                            updated:        { type: Date,    required: false, default: Date.now},
                            user:           { type: String,  required: true},
                        } ],
    responseMapper: { type: Object, default:{}},
    asycn:          { type: Boolean, required: false, default: false}
});
TranTypeSchema.virtual('isActive').get(function() {
    return (this.status && this.status.valueOf() == 'ACTIVE');
});
TranTypeSchema.index({ code: 1, bank:1}, { unique: true });
TranTypeSchema.plugin(base);
TranTypeSchema.plugin(auditor);
TranTypeSchema.pre('save', function(next) {
    var self = this;
    if(self.name) {
        self.name = S(self.name).collapseWhitespace().s;
        self.name = S(self.name).replaceAll(' ', '_').s;
    }
    Bank.findOne({_id:self.bank}, function(err, bank){
        if(!err && bank){
            next();
        }else{
            next(new Error('#transtype.create.bank.invalid'));
        }
    });
});
TranTypeSchema.pre('save', function(next) {
    var self    =   this;
    Flow.findOne({_id:self.tran_flow}, function(err, flow){
        if(!err && flow){
            var steps   =   flow.steps;
            for(var i in self.responseMapper){
                var name    =   S(self.responseMapper[i]).chompRight('.').s;
                var exit    =   false;
                for( var j in  steps){
                    if(steps[j].name === name){
                        exit    =   true;
                        break;
                    }
                }
                if(!exit){
                   return next(new Error('#transtype.create.mapper.step.invalid'));
                }
            }
            next();
        }else{
            next(new Error('#transtype.create.flow.invalid'));
        }
    });
});
//-----------------------------//
TranTypeSchema.methods.locateStepInteractions    =   function(current_step, callback){
    var self        =   this;
    var steps       =   self.requestMapper.steps;
    for(i=0; i<steps.length;i++){
        var step    =   steps[i];
        if(step.name === current_step){
            return callback(null, step.mapper);
        }
    }
    return callback('#trans_type.interaction.step.invalid');
}
TranTypeSchema.virtual('pross_name').get(function () {
    return this.name + '_' + this.code;
});
module.exports = mongoose.model('TransactionType', TranTypeSchema);
